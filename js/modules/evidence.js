/**
 * Evidence Module - Manages evidence vault (photos, videos, audio, documents)
 */

class EvidenceManager {
  constructor() {
    this.evidenceList = [];
  }

  /**
   * Add new evidence to the vault
   */
  async addEvidence(file, metadata = {}) {
    try {
      const user = userManager.getCurrentUser();
      if (!user) {
        throw new Error('User not logged in');
      }

      // Validate file size
      if (file.size > CONFIG.EVIDENCE.MAX_FILE_SIZE) {
        throw new Error(CONFIG.ERRORS.FILE_TOO_LARGE);
      }

      // Determine evidence type
      const type = this.getEvidenceType(file.type);
      if (!type) {
        throw new Error(CONFIG.ERRORS.UNSUPPORTED_FILE);
      }

      // Convert file to base64
      const fileData = await Utils.fileToBase64(file);

      // Get current location
      let location = null;
      try {
        location = await Utils.getCurrentLocation();
      } catch (error) {
        Utils.log.warn('Could not get location for evidence:', error);
      }

      // Create evidence record
      const evidence = {
        user_id: user.id,
        type,
        title: metadata.title || file.name,
        file_path: fileData, // Store base64 data
        file_size: file.size,
        description: metadata.description || '',
        is_encrypted: CONFIG.EVIDENCE.AUTO_ENCRYPT,
        is_verified: false,
        location_lat: location?.latitude || null,
        location_lng: location?.longitude || null,
        metadata: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          ...metadata
        }),
        created_at: new Date().toISOString()
      };

      // Save to database
      const evidenceId = await dbManager.add('evidence', evidence);
      evidence.id = evidenceId;

      // Send metadata to server
      await apiService.sendEvidenceMetadata({
        evidenceId,
        type,
        title: evidence.title,
        fileSize: file.size,
        location: location
      });

      Utils.log.success('Evidence added:', evidence.id);
      Utils.showToast(CONFIG.SUCCESS.EVIDENCE_ADDED, 'success');

      return { success: true, evidence };
    } catch (error) {
      Utils.log.error('Add evidence error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Get evidence type from MIME type
   */
  getEvidenceType(mimeType) {
    if (CONFIG.EVIDENCE.SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
      return CONFIG.EVIDENCE_TYPES.PHOTO;
    }
    if (CONFIG.EVIDENCE.SUPPORTED_VIDEO_TYPES.includes(mimeType)) {
      return CONFIG.EVIDENCE_TYPES.VIDEO;
    }
    if (CONFIG.EVIDENCE.SUPPORTED_AUDIO_TYPES.includes(mimeType)) {
      return CONFIG.EVIDENCE_TYPES.AUDIO;
    }
    return null;
  }

  /**
   * Get all evidence for current user
   */
  async getEvidenceList(filterType = null) {
    try {
      const user = userManager.getCurrentUser();
      if (!user) {
        return [];
      }

      let evidence = await dbManager.getByIndex('evidence', 'user_id', user.id);

      // Filter by type if specified
      if (filterType) {
        evidence = evidence.filter(e => e.type === filterType);
      }

      // Sort by created_at (newest first)
      evidence.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      this.evidenceList = evidence;
      return evidence;
    } catch (error) {
      Utils.log.error('Get evidence error:', error);
      return [];
    }
  }

  /**
   * Get single evidence by ID
   */
  async getEvidence(evidenceId) {
    try {
      const evidence = await dbManager.get('evidence', evidenceId);
      return evidence;
    } catch (error) {
      Utils.log.error('Get evidence error:', error);
      return null;
    }
  }

  /**
   * Delete evidence
   */
  async deleteEvidence(evidenceId) {
    try {
      const confirmed = await Utils.confirm(
        'Are you sure you want to delete this evidence? This action cannot be undone.',
        'Delete Evidence'
      );

      if (!confirmed) {
        return { success: false, cancelled: true };
      }

      await dbManager.delete('evidence', evidenceId);

      Utils.log.success('Evidence deleted:', evidenceId);
      Utils.showToast('Evidence deleted successfully', 'success');

      return { success: true };
    } catch (error) {
      Utils.log.error('Delete evidence error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Update evidence metadata
   */
  async updateEvidence(evidenceId, updates) {
    try {
      const evidence = await dbManager.get('evidence', evidenceId);
      if (!evidence) {
        throw new Error('Evidence not found');
      }

      const updatedEvidence = { ...evidence, ...updates };
      await dbManager.update('evidence', updatedEvidence);

      Utils.log.success('Evidence updated:', evidenceId);
      Utils.showToast('Evidence updated successfully', 'success');

      return { success: true, evidence: updatedEvidence };
    } catch (error) {
      Utils.log.error('Update evidence error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Render evidence grid on the screen
   */
  async renderEvidenceGrid() {
    try {
      const container = document.querySelector('#evidence-screen .grid');
      if (!container) {
        Utils.log.warn('Evidence grid container not found');
        return;
      }

      const evidenceList = await this.getEvidenceList();

      if (evidenceList.length === 0) {
        container.innerHTML = `
          <div class="col-span-full text-center py-12">
            <p class="text-gray-400 text-lg mb-4">No evidence yet</p>
            <button onclick="evidenceManager.openFileUpload()" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg">
              Add First Evidence
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = evidenceList.map(evidence => `
        <div class="bg-gray-800 p-4 rounded-lg flex flex-col items-start aspect-square justify-between hover:bg-gray-700 cursor-pointer"
             onclick="evidenceManager.viewEvidence(${evidence.id})">
          <div>
            <div class="text-4xl">${Utils.getEvidenceIcon(evidence.type)}</div>
            <h3 class="font-bold mt-2 truncate">${Utils.sanitize(evidence.title)}</h3>
            <p class="text-xs text-gray-400">${Utils.formatDate(evidence.created_at)}</p>
          </div>
          <div class="self-end text-purple-400">
            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      `).join('');

    } catch (error) {
      Utils.log.error('Render evidence grid error:', error);
    }
  }

  /**
   * Open file upload dialog
   */
  openFileUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*,audio/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        Utils.showLoading('Uploading evidence...');
        await this.addEvidence(file);
        Utils.hideLoading();
        await this.renderEvidenceGrid();
      }
    };
    input.click();
  }

  /**
   * View evidence details
   */
  async viewEvidence(evidenceId) {
    try {
      const evidence = await this.getEvidence(evidenceId);
      if (!evidence) {
        Utils.showToast('Evidence not found', 'error');
        return;
      }

      // Create modal to view evidence
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4';
      modal.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 max-w-2xl w-full text-white max-h-screen overflow-y-auto">
          <div class="flex justify-between items-start mb-4">
            <h2 class="text-2xl font-bold">${Utils.sanitize(evidence.title)}</h2>
            <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="mb-4">
            ${this.renderEvidencePreview(evidence)}
          </div>

          <div class="space-y-2 text-sm">
            <p><span class="text-gray-400">Type:</span> ${evidence.type}</p>
            <p><span class="text-gray-400">Size:</span> ${Utils.formatFileSize(evidence.file_size)}</p>
            <p><span class="text-gray-400">Date:</span> ${Utils.formatDateTime(evidence.created_at)}</p>
            ${evidence.description ? `<p><span class="text-gray-400">Description:</span> ${Utils.sanitize(evidence.description)}</p>` : ''}
            ${evidence.location_lat ? `<p><span class="text-gray-400">Location:</span> ${evidence.location_lat.toFixed(6)}, ${evidence.location_lng.toFixed(6)}</p>` : ''}
          </div>

          <div class="mt-6 flex gap-3">
            <button onclick="evidenceManager.downloadEvidence(${evidence.id})" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">
              Download
            </button>
            <button onclick="evidenceManager.deleteEvidence(${evidence.id}).then(() => this.closest('.fixed').remove()).then(() => evidenceManager.renderEvidenceGrid())" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
              Delete
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

    } catch (error) {
      Utils.log.error('View evidence error:', error);
      Utils.showToast('Error viewing evidence', 'error');
    }
  }

  /**
   * Render evidence preview based on type
   */
  renderEvidencePreview(evidence) {
    switch (evidence.type) {
      case CONFIG.EVIDENCE_TYPES.PHOTO:
        return `<img src="${evidence.file_path}" alt="${evidence.title}" class="w-full rounded-lg">`;
      case CONFIG.EVIDENCE_TYPES.VIDEO:
        return `<video src="${evidence.file_path}" controls class="w-full rounded-lg"></video>`;
      case CONFIG.EVIDENCE_TYPES.AUDIO:
        return `<audio src="${evidence.file_path}" controls class="w-full"></audio>`;
      default:
        return `<div class="text-center py-8 text-gray-400">Preview not available</div>`;
    }
  }

  /**
   * Download evidence
   */
  async downloadEvidence(evidenceId) {
    try {
      const evidence = await this.getEvidence(evidenceId);
      if (!evidence) {
        throw new Error('Evidence not found');
      }

      // Create download link
      const link = document.createElement('a');
      link.href = evidence.file_path;
      link.download = evidence.title;
      link.click();

      Utils.showToast('Evidence downloaded', 'success');
    } catch (error) {
      Utils.log.error('Download evidence error:', error);
      Utils.showToast('Error downloading evidence', 'error');
    }
  }

  /**
   * Search evidence
   */
  async searchEvidence(query) {
    const allEvidence = await this.getEvidenceList();
    return allEvidence.filter(e =>
      e.title.toLowerCase().includes(query.toLowerCase()) ||
      e.description.toLowerCase().includes(query.toLowerCase())
    );
  }
}

// Create singleton instance
const evidenceManager = new EvidenceManager();

// API Configuration
const API_BASE = 'https://api.hamdan.help/api';
 //const API_BASE = 'http://localhost:3000/api';

class RamadanAdmin {
    constructor() {
        this.greetings = [];
        this.settings = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadGreetings();
        this.loadSettings();
    }

    setupEventListeners() {
        // Add Greeting
        document.getElementById('addGreetingBtn').addEventListener('click', () => this.addGreeting());
        
        // Edit Greeting
        document.getElementById('editGreetingBtn').addEventListener('click', () => this.updateGreeting());

        // Upload Template
        document.getElementById('uploadTemplateBtn').addEventListener('click', () => this.uploadTemplate());
        document.getElementById('templateFile').addEventListener('change', (e) => this.previewTemplate(e));

        // Settings Form
        document.getElementById('settingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // Color inputs sync
        document.getElementById('greetingColor').addEventListener('change', (e) => {
            document.getElementById('greetingColorText').value = e.target.value;
        });
        document.getElementById('greetingColorText').addEventListener('change', (e) => {
            document.getElementById('greetingColor').value = e.target.value;
        });

        document.getElementById('userNameColor').addEventListener('change', (e) => {
            document.getElementById('userNameColorText').value = e.target.value;
        });
        document.getElementById('userNameColorText').addEventListener('change', (e) => {
            document.getElementById('userNameColor').value = e.target.value;
        });
    }

    async loadGreetings() {
        try {
            document.getElementById('greetingsLoading').style.display = 'block';
            
            const response = await fetch(`${API_BASE}/admin/ramadan/greetings`);
            const data = await response.json();

            if (data.success) {
                this.greetings = data.data;
                this.renderGreetings();
            }
        } catch (error) {
            console.error('Error loading greetings:', error);
            this.showAlert('خطأ في تحميل التهنئات', 'danger');
        } finally {
            document.getElementById('greetingsLoading').style.display = 'none';
        }
    }

    renderGreetings() {
        const container = document.getElementById('greetingsList');
        
        if (this.greetings.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">لا توجد تهنئات سجلة</p>';
            return;
        }

        container.innerHTML = this.greetings.map(greeting => `
            <div class="greeting-item">
                <div>
                    <div class="greeting-text">
                        <strong>الترتيب:</strong> ${greeting.order} | <strong>النص:</strong> ${greeting.text}
                    </div>
                    <span class="badge ${greeting.isEnabled ? 'badge-enabled' : 'badge-disabled'}">
                        ${greeting.isEnabled ? 'مفعلة' : 'معطلة'}
                    </span>
                </div>
                <div>
                    <button class="btn btn-sm btn-warning" onclick="admin.openEditGreeting('${greeting.id}')">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="admin.deleteGreeting('${greeting.id}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadSettings() {
        try {
            const response = await fetch(`${API_BASE}/ramadan/settings`);
            const data = await response.json();

            if (data.success) {
                this.settings = data.data;
                this.populateSettings();
                this.loadTemplates();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async loadTemplates() {
        try {
            document.getElementById('templatesLoading').style.display = 'block';
            
            // Templates are part of settings, so we just render them from this.settings
            this.renderTemplates();
        } catch (error) {
            console.error('Error loading templates:', error);
            this.showAlert('خطأ في تحميل النماذج', 'danger');
        } finally {
            document.getElementById('templatesLoading').style.display = 'none';
        }
    }

    renderTemplates() {
        const container = document.getElementById('templatesList');
        
        if (!this.settings || !this.settings.templates || this.settings.templates.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">لا توجد نماذج مرفوعة</p>';
            return;
        }

        container.innerHTML = this.settings.templates.map(template => `
            <div class="template-item" style="border: 1px solid #e0e7ef; border-radius: 10px; padding: 15px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: start; gap: 15px;">
                    <div style="flex: 1;">
                        <p style="margin: 0 0 10px 0; font-weight: 600; color: var(--primary-color);">${template.name || 'بدون اسم'}</p>
                        <img src="${template.url}" style="max-width: 200px; border-radius: 8px; margin-bottom: 10px;">
                        <p style="margin: 5px 0; font-size: 12px; color: #999;">
                            رفع: ${new Date(template.uploadedAt).toLocaleDateString('ar-SA')}
                        </p>
                        ${this.settings.activeTemplateId && this.settings.activeTemplateId.toString() === template._id.toString() 
                            ? '<span class="badge bg-success" style="margin-top: 10px;"><i class="fas fa-check"></i> نموذج نشط</span>' 
                            : ''}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${!this.settings.activeTemplateId || this.settings.activeTemplateId.toString() !== template._id.toString() 
                            ? `<button class="btn btn-sm btn-success" onclick="admin.activateTemplate('${template._id}')">
                                <i class="fas fa-star"></i> تفعيل
                              </button>` 
                            : ''}
                        <button class="btn btn-sm btn-danger" onclick="admin.deleteTemplate('${template._id}')">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    previewTemplate(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const preview = document.getElementById('templatePreview');
            preview.innerHTML = `
                <div style="margin-top: 15px;">
                    <p class="small text-muted">معاينة:</p>
                    <img src="${event.target.result}" style="max-width: 100%; border-radius: 8px; border: 2px dashed var(--primary-color); padding: 10px;">
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }

    async uploadTemplate() {
        const file = document.getElementById('templateFile').files[0];
        const name = document.getElementById('templateName').value.trim();

        if (!file) {
            this.showAlert('الرجاء اختيار ملف صورة', 'warning');
            return;
        }

        if (!name) {
            this.showAlert('الرجاء إدخال اسم النموذج', 'warning');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('templateImage', file);
            formData.append('name', name);

            console.log('Uploading to:', `${API_BASE}/admin/ramadan/template`);
            console.log('File:', file.name, file.size, file.type);

            const response = await fetch(`${API_BASE}/admin/ramadan/template`, {
                method: 'POST',
                body: formData
            });

            console.log('Response status:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error response:', errorText);
                this.showAlert(`خطأ من السيرفر: ${response.status}`, 'danger');
                return;
            }

            const data = await response.json();
            console.log('Upload response:', data);

            if (data.success) {
                this.showAlert('تم رفع النموذج بنجاح', 'success');
                this.settings = data.data;
                this.renderTemplates();
                document.getElementById('uploadTemplateForm').reset();
                document.getElementById('templatePreview').innerHTML = '';
                bootstrap.Modal.getInstance(document.getElementById('uploadTemplateModal')).hide();
            } else {
                this.showAlert(data.message || 'خطأ في رفع النموذج', 'danger');
            }
        } catch (error) {
            console.error('Error uploading template:', error);
            console.error('Error stack:', error.stack);
            this.showAlert('خطأ في الاتصال: ' + error.message, 'danger');
        }
    }

    async deleteTemplate(id) {
        if (!confirm('هل أنت متأكد من حذف هذا النموذج؟')) return;

        try {
            const response = await fetch(`${API_BASE}/admin/ramadan/template/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.showAlert('تم حذف النموذج بنجاح', 'success');
                this.settings = data.data;
                this.renderTemplates();
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            this.showAlert('خطأ في حذف النموذج', 'danger');
        }
    }

    async activateTemplate(id) {
        try {
            const response = await fetch(`${API_BASE}/admin/ramadan/template/${id}/activate`, {
                method: 'PUT'
            });

            const data = await response.json();

            if (data.success) {
                this.showAlert('تم تفعيل النموذج بنجاح', 'success');
                this.settings = data.data;
                this.renderTemplates();
                this.populateSettings();
            }
        } catch (error) {
            console.error('Error activating template:', error);
            this.showAlert('خطأ في تفعيل النموذج', 'danger');
        }
    }

    populateSettings() {
        if (!this.settings) return;

        document.getElementById('greetingFont').value = this.settings.greetingFont || 'Traditional Arabic';
        document.getElementById('greetingFontSize').value = this.settings.greetingFontSize || 28;
        document.getElementById('userNameFont').value = this.settings.userNameFont || 'Traditional Arabic';
        document.getElementById('userNameFontSize').value = this.settings.userNameFontSize || 24;
        document.getElementById('greetingColor').value = this.settings.greetingColor || '#7a461f';
        document.getElementById('greetingColorText').value = this.settings.greetingColor || '#7a461f';
        document.getElementById('userNameColor').value = this.settings.userNameColor || '#004052';
        document.getElementById('userNameColorText').value = this.settings.userNameColor || '#004052';
        document.getElementById('greetingPositionX').value = this.settings.greetingPositionX || 85;
        document.getElementById('greetingPositionY').value = this.settings.greetingPositionY || 52;
        document.getElementById('isActive').checked = this.settings.isActive !== false;
    }

    async addGreeting() {
        const text = document.getElementById('greetingText').value.trim();
        const order = parseInt(document.getElementById('greetingOrder').value) || 0;
        const isEnabled = document.getElementById('greetingEnabled').checked;

        if (!text) {
            this.showAlert('الرجاء إدخال نص التهنئة', 'warning');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/admin/ramadan/greeting`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, order, isEnabled })
            });

            const data = await response.json();

            if (data.success) {
                this.showAlert('تم إضافة التهنئة بنجاح', 'success');
                document.getElementById('addGreetingForm').reset();
                bootstrap.Modal.getInstance(document.getElementById('addGreetingModal')).hide();
                this.loadGreetings();
            }
        } catch (error) {
            console.error('Error adding greeting:', error);
            this.showAlert('خطأ في إضافة التهنئة', 'danger');
        }
    }

    async openEditGreeting(id) {
        const greeting = this.greetings.find(g => g.id === id);
        if (!greeting) return;

        document.getElementById('editGreetingId').value = greeting.id;
        document.getElementById('editGreetingText').value = greeting.text;
        document.getElementById('editGreetingOrder').value = greeting.order;
        document.getElementById('editGreetingEnabled').checked = greeting.isEnabled;

        new bootstrap.Modal(document.getElementById('editGreetingModal')).show();
    }

    async updateGreeting() {
        const id = document.getElementById('editGreetingId').value;
        const text = document.getElementById('editGreetingText').value.trim();
        const order = parseInt(document.getElementById('editGreetingOrder').value) || 0;
        const isEnabled = document.getElementById('editGreetingEnabled').checked;

        if (!text) {
            this.showAlert('الرجاء إدخال نص التهنئة', 'warning');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/admin/ramadan/greeting/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, order, isEnabled })
            });

            const data = await response.json();

            if (data.success) {
                this.showAlert('تم تحديث التهنئة بنجاح', 'success');
                bootstrap.Modal.getInstance(document.getElementById('editGreetingModal')).hide();
                this.loadGreetings();
            }
        } catch (error) {
            console.error('Error updating greeting:', error);
            this.showAlert('خطأ في تحديث التهنئة', 'danger');
        }
    }

    async deleteGreeting(id) {
        if (!confirm('هل أنت متأكد من حذف هذه التهنئة؟')) return;

        try {
            const response = await fetch(`${API_BASE}/admin/ramadan/greeting/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.showAlert('تم حذف التهنئة بنجاح', 'success');
                this.loadGreetings();
            }
        } catch (error) {
            console.error('Error deleting greeting:', error);
            this.showAlert('خطأ في حذف التهنئة', 'danger');
        }
    }

    previewImage(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `<img src="${event.target.result}" class="img-fluid image-preview" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }

    async saveSettings() {
        try {
            const settingsData = {
                greetingFont: document.getElementById('greetingFont').value,
                greetingFontSize: parseInt(document.getElementById('greetingFontSize').value),
                userNameFont: document.getElementById('userNameFont').value,
                userNameFontSize: parseInt(document.getElementById('userNameFontSize').value),
                greetingColor: document.getElementById('greetingColor').value,
                userNameColor: document.getElementById('userNameColor').value,
                greetingPositionX: parseInt(document.getElementById('greetingPositionX').value),
                greetingPositionY: parseInt(document.getElementById('greetingPositionY').value),
                isActive: document.getElementById('isActive').checked
            };

            console.log('Saving settings to:', `${API_BASE}/admin/ramadan/settings`);
            console.log('Settings data:', settingsData);

            const response = await fetch(`${API_BASE}/admin/ramadan/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settingsData)
            });

            console.log('Response status:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error:', errorText);
                this.showAlert(`خطأ من السيرفر: ${response.status}`, 'danger');
                return;
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (data.success) {
                this.showAlert('تم حفظ الإعدادات بنجاح', 'success');
                this.settings = data.data;
                this.populateSettings();
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showAlert('خطأ في حفظ الإعدادات: ' + error.message, 'danger');
        }
    }

    showAlert(message, type = 'info') {
        const messageEl = document.getElementById('successMessage');
        const textEl = document.getElementById('successText');
        
        messageEl.className = `alert alert-${type === 'success' ? 'success' : 'danger'} success-message`;
        textEl.textContent = message;
        messageEl.style.display = 'block';

        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 4000);
    }
}

// Initialize admin panel when DOM is ready
let admin;
document.addEventListener('DOMContentLoaded', () => {
    admin = new RamadanAdmin();
});

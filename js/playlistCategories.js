/**
 * Playlist Category Management JavaScript
 * Handles all category-related operations in the admin dashboard
 * Note: BASE_URL and token are expected to be defined globally by playlists.html
 */

// BASE_URL and token are defined in playlists.html

// Category Management Functions
async function loadPlaylistCategories(playlistId) {
  try {
    const res = await fetch(`${BASE_URL}/playlists/${playlistId}/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    
    if (data.success) {
      return data.data;
    } else {
      console.error('Error loading categories:', data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

async function createCategory(playlistId, title, description = '') {
  try {
    const res = await fetch(`${BASE_URL}/playlists/${playlistId}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, description })
    });
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: error.message };
  }
}

async function updateCategory(playlistId, categoryId, title, description = '') {
  try {
    const res = await fetch(`${BASE_URL}/playlists/${playlistId}/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, description })
    });
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: error.message };
  }
}

async function deleteCategory(playlistId, categoryId) {
  try {
    const res = await fetch(`${BASE_URL}/playlists/${playlistId}/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: error.message };
  }
}

async function assignCourseToCategory(courseId, categoryId) {
  try {
    const res = await fetch(`${BASE_URL}/courses/${courseId}/assign-category`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ categoryId })
    });
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error assigning course to category:', error);
    return { success: false, error: error.message };
  }
}

async function reorderCategories(playlistId, categories) {
  try {
    const res = await fetch(`${BASE_URL}/playlists/${playlistId}/categories/reorder`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ categories })
    });
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error reordering categories:', error);
    return { success: false, error: error.message };
  }
}

// Render categories management interface
async function renderCategoryManagement(playlistId, playlistTitle, playlist) {
  try {
    const categories = playlist.categories || [];
    
    const container = document.getElementById('categoryManagementContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Create categories section
    const categorySection = document.createElement('div');
    categorySection.className = 'card mb-4';
    categorySection.innerHTML = `
      <div class="card-header bg-secondary text-white">
        <h5 class="mb-0">
          <i class="bi bi-folder me-2"></i>Categories / Menus
          <span class="float-end">
            <button class="btn btn-sm btn-success" id="addCategoryBtn-${playlistId}">
              <i class="bi bi-plus-circle me-1"></i>Add Category
            </button>
          </span>
        </h5>
      </div>
      <div class="card-body">
        <div id="categoriesList-${playlistId}" class="categories-list"></div>
      </div>
    `;
    
    container.appendChild(categorySection);
    
    const categoriesList = document.getElementById(`categoriesList-${playlistId}`);
    
    if (categories.length === 0) {
      categoriesList.innerHTML = '<p class="text-muted">No categories found. Create your first one!</p>';
    } else {
      categories.forEach((category, index) => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'card mb-3 category-card';
        categoryCard.setAttribute('data-category-id', category.id);
        categoryCard.innerHTML = `
          <div class="card-header ${category.isDefault ? 'bg-info' : 'bg-dark'} text-white d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              <i class="bi bi-grip-vertical me-2 drag-handle-category" style="cursor: grab;"></i>
              <span class="fw-bold">${category.title}</span>
              ${category.isDefault ? '<span class="badge bg-warning ms-2">Default</span>' : ''}
              <span class="badge bg-secondary ms-2">${category.courseCount || 0} videos</span>
            </div>
            <div>
              ${!category.isDefault ? `
                <button class="btn btn-sm btn-warning edit-category-btn" data-category-id="${category.id}" data-playlist-id="${playlistId}">
                  <i class="bi bi-pencil me-1"></i>Edit
                </button>
                <button class="btn btn-sm btn-danger delete-category-btn" data-category-id="${category.id}" data-playlist-id="${playlistId}">
                  <i class="bi bi-trash me-1"></i>Delete
                </button>
              ` : ''}
            </div>
          </div>
          <div class="card-body">
            <div class="category-courses-list" id="courses-${category.id}">
              <div class="text-center py-2">
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Loading courses...
              </div>
            </div>
          </div>
        `;
        
        categoriesList.appendChild(categoryCard);
        
        // Render courses in this category
        renderCoursesInCategory(category, playlistId, playlist);
      });
    }
    
    // Add event listeners
    document.getElementById(`addCategoryBtn-${playlistId}`).addEventListener('click', () => {
      showAddCategoryModal(playlistId);
    });
    
    // Edit category buttons
    document.querySelectorAll('.edit-category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const categoryId = btn.getAttribute('data-category-id');
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          showEditCategoryModal(category, playlistId);
        }
      });
    });
    
    // Delete category buttons
    document.querySelectorAll('.delete-category-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const categoryId = btn.getAttribute('data-category-id');
        const playlistId = btn.getAttribute('data-playlist-id');
        
        if (confirm('Are you sure you want to delete this category? All videos will be moved to the default category.')) {
          const result = await deleteCategory(playlistId, categoryId);
          if (result.success) {
            showToast('Category deleted successfully!', 'success');
            loadPlaylists(); // Reload playlists
          } else {
            showToast('Error deleting category: ' + result.message, 'danger');
          }
        }
      });
    });
    
    // Initialize category reordering
    const categoriesList_elem = document.getElementById(`categoriesList-${playlistId}`);
    if (categoriesList_elem && categories.length > 1) {
      new Sortable(categoriesList_elem, {
        animation: 300,
        handle: '.drag-handle-category',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: async () => {
          const reorderedCategories = [];
          Array.from(categoriesList_elem.children).forEach((item, index) => {
            const categoryId = item.getAttribute('data-category-id');
            reorderedCategories.push({ id: categoryId, order: index });
          });
          
          const result = await reorderCategories(playlistId, reorderedCategories);
          if (result.success) {
            showToast('Categories reordered!', 'success');
          }
        }
      });
    }
    
  } catch (error) {
    console.error('Error rendering category management:', error);
  }
}

function renderCoursesInCategory(category, playlistId, playlist) {
  const coursesList = document.getElementById(`courses-${category.id}`);
  const courses = category.courses || [];
  
  if (courses.length === 0) {
    coursesList.innerHTML = '<p class="text-muted">No videos in this category</p>';
    return;
  }
  
  coursesList.innerHTML = `
    <div class="list-group">
      ${courses.map((course, index) => `
        <div class="list-group-item list-group-item-dark d-flex justify-content-between align-items-center course-in-category" 
             data-course-id="${course.id}">
          <div>
            <h6 class="mb-1">${index + 1}. ${course.title}</h6>
            <small class="text-muted">${course.description || 'No description'}</small>
            ${course.duration ? `<br/><small class="text-info">Duration: ${course.duration}s</small>` : ''}
          </div>
          <div>
            <select class="form-select form-select-sm" style="width: 200px;" onchange="moveCourseToCategory('${course.id}', this.value, '${playlistId}')">
              <option value="">Move to Category...</option>
              ${(playlist.categories || []).map(cat => `
                <option value="${cat.id}" ${cat.id === category.id ? 'selected' : ''}>${cat.title}</option>
              `).join('')}
            </select>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function moveCourseToCategory(courseId, categoryId, playlistId) {
  if (!categoryId) return;
  
  const result = await assignCourseToCategory(courseId, categoryId);
  if (result.success) {
    showToast('Video moved to category!', 'success');
    loadPlaylists(); // Reload to show updated structure
  } else {
    showToast('Error moving video: ' + result.message, 'danger');
  }
}

function showAddCategoryModal(playlistId) {
  const title = prompt('Enter category name:');
  if (!title) return;
  
  const description = prompt('Enter category description (optional):');
  
  createCategory(playlistId, title, description || '').then(result => {
    if (result.success) {
      showToast('Category created successfully!', 'success');
      loadPlaylists();
    } else {
      showToast('Error creating category: ' + result.message, 'danger');
    }
  });
}

function showEditCategoryModal(category, playlistId) {
  const title = prompt('Edit category name:', category.title);
  if (!title) return;
  
  const description = prompt('Edit category description:', category.description || '');
  
  updateCategory(playlistId, category.id, title, description || '').then(result => {
    if (result.success) {
      showToast('Category updated successfully!', 'success');
      loadPlaylists();
    } else {
      showToast('Error updating category: ' + result.message, 'danger');
    }
  });
}

// Make functions globally available
window.moveCourseToCategory = moveCourseToCategory;
window.renderCategoryManagement = renderCategoryManagement;
window.loadPlaylistCategories = loadPlaylistCategories;

// Client-side pagination utilities
class ClientPagination {
  constructor(options = {}) {
    this.data = [];
    this.filteredData = [];
    this.currentPage = 1;
    this.pageSize = options.pageSize || 50;
    this.totalPages = 0;
    this.renderCallback = options.renderCallback || (() => {});
    this.countCallback = options.countCallback || (() => {});
    this.searchCache = new Map(); // Cache for search results
    this.lastSearchQuery = '';
  }

  // Set the full dataset
  setData(data) {
    this.data = Array.isArray(data) ? data : [];
    this.filteredData = [...this.data];
    this.calculateTotalPages();
    this.goToPage(1);
  }

  // Calculate total pages based on data length and page size
  calculateTotalPages() {
    this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
    return this.totalPages;
  }

  // Get current page data
  getCurrentPageData() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredData.slice(startIndex, endIndex);
  }

  // Go to specific page
  goToPage(page) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > this.totalPages) {
      return false;
    }
    this.currentPage = pageNum;
    const pageData = this.getCurrentPageData();
    this.renderCallback(pageData);
    this.countCallback({
      start: (this.currentPage - 1) * this.pageSize + 1,
      end: Math.min(this.currentPage * this.pageSize, this.filteredData.length),
      total: this.filteredData.length,
      totalOriginal: this.data.length
    });
    return true;
  }

  // Go to next page
  nextPage() {
    return this.goToPage(this.currentPage + 1);
  }

  // Go to previous page
  prevPage() {
    return this.goToPage(this.currentPage - 1);
  }

  // Filter data
  filterData(filterFn) {
    if (typeof filterFn !== 'function') {
      this.filteredData = [...this.data];
    } else {
      this.filteredData = this.data.filter(filterFn);
    }
    this.calculateTotalPages();
    return this.goToPage(1);
  }

  // Search by text across multiple fields with optimized performance and caching
  searchByText(query, fields) {
    if (!query || query.trim() === '') {
      this.lastSearchQuery = '';
      this.searchCache.clear();
      return this.filterData(null);
    }
    
    const searchTerm = query.toLowerCase().trim();
    
    // Check cache for exact match
    if (this.searchCache.has(searchTerm)) {
      this.filteredData = this.searchCache.get(searchTerm);
      this.calculateTotalPages();
      this.lastSearchQuery = searchTerm;
      return this.goToPage(1);
    }
    
    const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
    
    // Use previous results if current query extends the last one
    let dataToSearch = this.data;
    if (this.lastSearchQuery && searchTerm.startsWith(this.lastSearchQuery) && this.filteredData.length < this.data.length) {
      dataToSearch = this.filteredData;
    }
    
    const results = dataToSearch.filter(item => {
      // Create a searchable text from all specified fields
      const searchableText = fields
        .map(field => {
          const value = item[field];
          return value ? String(value).toLowerCase() : '';
        })
        .join(' ');
      
      // Check if all search words are found in the searchable text
      return searchWords.every(word => searchableText.includes(word));
    });
    
    // Cache the results
    this.searchCache.set(searchTerm, results);
    
    // Limit cache size to prevent memory issues
    if (this.searchCache.size > 50) {
      const firstKey = this.searchCache.keys().next().value;
      this.searchCache.delete(firstKey);
    }
    
    this.filteredData = results;
    this.calculateTotalPages();
    this.lastSearchQuery = searchTerm;
    return this.goToPage(1);
  }

  // Change page size
  setPageSize(size) {
    this.pageSize = parseInt(size, 10) || 50;
    this.calculateTotalPages();
    return this.goToPage(1);
  }

  // Generate pagination HTML
  generatePaginationHTML() {
    if (this.totalPages <= 1) {
      return '';
    }

    let html = '';
    
    // Previous button
    html += `<li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="prev" aria-label="Previous">
        <span aria-hidden="true">&laquo;</span>
      </a>
    </li>`;

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages && startPage > 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page if not visible
    if (startPage > 1) {
      html += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
      if (startPage > 2) {
        html += `<li class="page-item disabled"><a class="page-link" href="#">...</a></li>`;
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      html += `<li class="page-item ${i === this.currentPage ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>`;
    }

    // Last page if not visible
    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) {
        html += `<li class="page-item disabled"><a class="page-link" href="#">...</a></li>`;
      }
      html += `<li class="page-item"><a class="page-link" href="#" data-page="${this.totalPages}">${this.totalPages}</a></li>`;
    }

    // Next button
    html += `<li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="next" aria-label="Next">
        <span aria-hidden="true">&raquo;</span>
      </a>
    </li>`;

    return html;
  }
}

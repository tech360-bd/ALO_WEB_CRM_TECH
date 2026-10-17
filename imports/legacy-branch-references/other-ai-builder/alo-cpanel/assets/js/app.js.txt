/* ============================================================
   ALO Education CRM — Front-end JavaScript
   Vanilla JS — no jQuery, no external libraries
   ============================================================ */
(function () {
    'use strict';

    /* ------------------------------------------------------------
       Config & state
       ------------------------------------------------------------ */
    var ALO = window.ALO = window.ALO || {};

    ALO.csrfToken  = window.ALO_CSRF_TOKEN  || '';
    ALO.csrfName   = window.ALO_CSRF_NAME   || '_csrf_token';
    ALO.baseUrl    = window.ALO_BASE_URL    || '';
    ALO.debug      = !!window.ALO_DEBUG;

    /* ------------------------------------------------------------
       1. AJAX helper — aloFetch(url, method, data) -> Promise
       ---------------------------------------------------------- */
    ALO.aloFetch = function (url, method, data) {
        method = (method || 'GET').toUpperCase();
        var opts = {
            method: method,
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-Token':     ALO.csrfToken,
                'Accept':            'application/json, text/javascript, */*'
            }
        };

        var isForm = data instanceof FormData;
        var hasBody = (method !== 'GET' && method !== 'HEAD');

        if (hasBody && data !== undefined && data !== null) {
            if (isForm) {
                // Attach CSRF token if missing
                if (!data.has(ALO.csrfName) && ALO.csrfToken) {
                    data.append(ALO.csrfName, ALO.csrfToken);
                }
                opts.body = data;
                // Let the browser set the multipart/form-data boundary
            } else {
                // JSON body
                opts.headers['Content-Type'] = 'application/json';
                var payload = Object.assign({}, data || {});
                payload[ALO.csrfName] = ALO.csrfToken;
                opts.body = JSON.stringify(payload);
            }
        }

        return fetch(ALO.baseUrl + url, opts).then(function (resp) {
            var contentType = resp.headers.get('Content-Type') || '';
            if (contentType.indexOf('application/json') !== -1) {
                return resp.json().then(function (json) {
                    if (!resp.ok) {
                        var err = new Error(json.message || ('HTTP ' + resp.status));
                        err.response = json;
                        err.status   = resp.status;
                        throw err;
                    }
                    return json;
                });
            }
            if (!resp.ok) {
                var err2 = new Error('HTTP ' + resp.status);
                err2.status = resp.status;
                throw err2;
            }
            return resp.text();
        });
    };

    /* Convenience wrappers */
    ALO.get  = function (url)         { return ALO.aloFetch(url, 'GET'); };
    ALO.post = function (url, data)   { return ALO.aloFetch(url, 'POST', data); };
    ALO.put  = function (url, data)   { return ALO.aloFetch(url, 'PUT', data); };
    ALO.del  = function (url, data)   { return ALO.aloFetch(url, 'DELETE', data); };

    /* ------------------------------------------------------------
       2. Modals
       ------------------------------------------------------------ */
    ALO.openModal = function (id) {
        var el = typeof id === 'string' ? document.getElementById(id) : id;
        if (!el) return;
        el.classList.add('open');
        document.body.style.overflow = 'hidden';
        var autofocus = el.querySelector('[data-autofocus], input:not([type="hidden"]):not([disabled])');
        if (autofocus) setTimeout(function () { autofocus.focus(); }, 50);
    };

    ALO.closeModal = function (id) {
        var el = typeof id === 'string' ? document.getElementById(id) : id;
        if (!el) return;
        el.classList.remove('open');
        document.body.style.overflow = '';
    };

    ALO.closeAllModals = function () {
        var modals = document.querySelectorAll('.modal-overlay.open');
        modals.forEach(function (m) { m.classList.remove('open'); });
        document.body.style.overflow = '';
    };

    /* ------------------------------------------------------------
       3. Drawers
       ------------------------------------------------------------ */
    ALO.openDrawer = function (id) {
        var el = typeof id === 'string' ? document.getElementById(id) : id;
        if (!el) return;
        el.classList.add('open');
        var overlay = document.querySelector('.drawer-overlay');
        if (overlay) overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    ALO.closeDrawer = function (id) {
        var el = typeof id === 'string' ? document.getElementById(id) : id;
        if (el) el.classList.remove('open');
        var overlay = document.querySelector('.drawer-overlay');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
    };

    /* ------------------------------------------------------------
       4. Toast notifications — showToast(message, type, opts)
       ------------------------------------------------------------ */
    ALO.showToast = function (message, type, opts) {
        type = type || 'info';
        opts = opts || {};
        var title = opts.title || ({
            success: 'Success',
            warning: 'Warning',
            danger:  'Error',
            info:    'Notice'
        })[type] || 'Notice';

        var container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        var icon = ({
            success: '\u2714',
            warning: '\u26A0',
            danger:  '\u2716',
            info:    '\u2139'
        })[type] || '\u2139';

        var toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.innerHTML =
            '<span style="font-size:1.05rem;">' + icon + '</span>' +
            '<div><span class="toast-title"></span>' +
            '<div class="toast-msg"></div></div>' +
            '<button class="toast-close" aria-label="Close">&times;</button>';
        toast.querySelector('.toast-title').textContent = title;
        toast.querySelector('.toast-msg').textContent   = message;

        var closeFn = function () {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            toast.style.transition = 'opacity .2s ease, transform .2s ease';
            setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 220);
        };
        toast.querySelector('.toast-close').addEventListener('click', closeFn);

        container.appendChild(toast);

        var duration = opts.duration || 4500;
        if (duration > 0) {
            setTimeout(closeFn, duration);
        }
        return toast;
    };

    /* ------------------------------------------------------------
       5. Confirmation dialog — confirmAction(message, opts, cb)
       ------------------------------------------------------------ */
    // Programmatic usage:
    //   ALO.confirmAction('Delete this?', {}, function (ok) { if (ok) ... });
    // Or via Promise:
    //   ALO.confirmPromise('Delete this?').then(function (ok) { ... });
    ALO.confirmAction = function (message, opts, cb) {
        opts = opts || {};
        var modalId = 'aloConfirmModal';
        var existing = document.getElementById(modalId);
        if (existing) existing.parentNode.removeChild(existing);

        var modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = modalId;
        var title = opts.title || 'Please Confirm';
        var confirmText = opts.confirmText || 'Confirm';
        var cancelText  = opts.cancelText  || 'Cancel';
        var danger = opts.danger ? 'btn-danger' : 'btn-primary';

        modal.innerHTML =
            '<div class="modal-dialog sm">' +
              '<div class="modal-header"><h3></h3>' +
                '<button class="modal-close" type="button" aria-label="Close">&times;</button>' +
              '</div>' +
              '<div class="modal-body"><p style="margin:0;font-size:.92rem;"></p></div>' +
              '<div class="modal-footer">' +
                '<button class="btn btn-secondary btn-cancel" type="button"></button>' +
                '<button class="btn ' + danger + ' btn-confirm" type="button"></button>' +
              '</div>' +
            '</div>';
        modal.querySelector('h3').textContent = title;
        modal.querySelector('.modal-body p').textContent = message;
        modal.querySelector('.btn-cancel').textContent  = cancelText;
        modal.querySelector('.btn-confirm').textContent = confirmText;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        setTimeout(function () { modal.classList.add('open'); }, 10);

        var close = function (result) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
            setTimeout(function () { if (modal.parentNode) modal.parentNode.removeChild(modal); }, 220);
            if (typeof cb === 'function') cb(result);
        };
        modal.querySelector('.modal-close').addEventListener('click', function () { close(false); });
        modal.querySelector('.btn-cancel').addEventListener('click', function () { close(false); });
        modal.querySelector('.btn-confirm').addEventListener('click', function () { close(true); });
        modal.addEventListener('click', function (e) { if (e.target === modal) close(false); });

        // ESC key
        var escHandler = function (e) {
            if (e.key === 'Escape') {
                close(false);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    };

    ALO.confirmPromise = function (message, opts) {
        return new Promise(function (resolve) {
            ALO.confirmAction(message, opts || {}, function (ok) { resolve(ok); });
        });
    };

    /* ------------------------------------------------------------
       6. AJAX form submission — submitForm(formId, successCb, opts)
       ------------------------------------------------------------ */
    ALO.submitForm = function (formId, successCb, opts) {
        opts = opts || {};
        var form = typeof formId === 'string' ? document.getElementById(formId) : formId;
        if (!form) {
            ALO.showToast('Form not found.', 'danger');
            return;
        }
        var submitBtn = form.querySelector('[type="submit"]');
        var originalHtml = submitBtn ? submitBtn.innerHTML : '';

        // Build FormData — preserves file uploads
        var formData = new FormData(form);
        // Ensure CSRF token is included
        if (ALO.csrfToken && !formData.has(ALO.csrfName)) {
            formData.append(ALO.csrfName, ALO.csrfToken);
        }
        // Method spoofing for PUT/DELETE
        var method = (form.getAttribute('method') || 'POST').toUpperCase();
        var realMethod = method;
        var methodField = form.querySelector('input[name="_method"]');
        if (methodField) realMethod = methodField.value.toUpperCase();

        var action = form.getAttribute('action') || window.location.pathname;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> ' + (opts.loadingText || 'Saving…');
        }

        ALO.aloFetch(action, realMethod, formData)
            .then(function (data) {
                if (typeof successCb === 'function') {
                    successCb(data, form);
                } else {
                    ALO.showToast(opts.successMessage || (data && data.message) || 'Saved successfully.', 'success');
                    if (opts.redirect) window.location.href = opts.redirect;
                    else if (opts.resetOnSuccess) form.reset();
                }
            })
            .catch(function (err) {
                var msg = (err && err.response && err.response.message)
                       || (err && err.message)
                       || 'Submission failed.';
                ALO.showToast(msg, 'danger');
                // Render validation errors if present
                if (err && err.response && err.response.errors) {
                    ALO.showValidationErrors(form, err.response.errors);
                }
            })
            .finally(function () {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalHtml;
                }
            });
    };

    ALO.showValidationErrors = function (form, errors) {
        // Clear existing
        form.querySelectorAll('.form-feedback.invalid').forEach(function (el) { el.remove(); });
        form.querySelectorAll('.is-invalid').forEach(function (el) { el.classList.remove('is-invalid'); });

        Object.keys(errors).forEach(function (field) {
            var input = form.querySelector('[name="' + field + '"]')
                     || form.querySelector('[name="' + field + '[]"]');
            if (!input) return;
            input.classList.add('is-invalid');
            var feedback = document.createElement('div');
            feedback.className = 'form-feedback invalid';
            feedback.textContent = Array.isArray(errors[field]) ? errors[field][0] : errors[field];
            input.parentNode.appendChild(feedback);
        });
    };

    /* ------------------------------------------------------------
       7. Table search/filter
       ------------------------------------------------------------ */
    ALO.tableSearch = function (inputSelector, tableSelector, opts) {
        opts = opts || {};
        var input = typeof inputSelector === 'string'
                  ? document.querySelector(inputSelector) : inputSelector;
        var table = typeof tableSelector === 'string'
                  ? document.querySelector(tableSelector) : tableSelector;
        if (!input || !table) return;

        var columnIndex = opts.columnIndex; // optional — restrict to specific column

        input.addEventListener('input', function () {
            var q = input.value.toLowerCase().trim();
            var rows = table.querySelectorAll('tbody tr');
            rows.forEach(function (row) {
                if (row.querySelector('.no-results')) return;
                var cells = row.querySelectorAll('td');
                var match = false;
                cells.forEach(function (cell, i) {
                    if (columnIndex !== undefined && i !== columnIndex) return;
                    if (cell.textContent.toLowerCase().indexOf(q) !== -1) match = true;
                });
                row.style.display = match ? '' : 'none';
            });
        });
    };

    /* ------------------------------------------------------------
       8. Sidebar toggle for mobile
       ------------------------------------------------------------ */
    ALO.toggleSidebar = function () {
        var sidebar = document.querySelector('.sidebar');
        var overlay  = document.querySelector('.sidebar-backdrop');
        if (!sidebar) return;
        var isOpen = sidebar.classList.toggle('open');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-backdrop';
            overlay.style.cssText =
                'position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:99;display:none;';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', ALO.toggleSidebar);
        }
        overlay.style.display = isOpen ? 'block' : 'none';
        document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    /* ------------------------------------------------------------
       9. Auto-attach CSRF token to all fetch() requests
       ---------------------------------------------------------- */
    (function patchFetch() {
        if (!window.fetch || window.fetch.__aloPatched) return;
        var originalFetch = window.fetch;
        window.fetch = function (input, init) {
            init = init || {};
            init.credentials = init.credentials || 'same-origin';
            init.headers = init.headers || {};
            // Convert Headers object to plain object
            var headers = init.headers;
            if (headers instanceof Headers) {
                var plain = {};
                headers.forEach(function (v, k) { plain[k] = v; });
                headers = plain;
            }
            // Only attach token for same-origin requests
            var url = (typeof input === 'string') ? input : (input && input.url);
            var isSameOrigin = !url || url.charAt(0) === '/' || url.indexOf(window.location.origin) === 0;
            if (isSameOrigin && ALO.csrfToken && !headers['X-CSRF-Token']) {
                headers['X-CSRF-Token'] = ALO.csrfToken;
            }
            if (!headers['X-Requested-With'] && isSameOrigin) {
                headers['X-Requested-With'] = 'XMLHttpRequest';
            }
            init.headers = headers;
            return originalFetch.call(this, input, init);
        };
        window.fetch.__aloPatched = true;
    })();

    /* ------------------------------------------------------------
       10. Number & date formatting
       ------------------------------------------------------------ */
    ALO.formatNumber = function (value, decimals) {
        value = parseFloat(value);
        if (isNaN(value)) value = 0;
        decimals = (decimals === undefined) ? 0 : decimals;
        return value.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };

    ALO.formatCurrency = function (value, currency) {
        currency = currency || 'BDT';
        var symbols = { BDT: '\u09F3', USD: '$', GBP: '\u00A3', EUR: '\u20AC', CAD: 'C$', AUD: 'A$' };
        var symbol = symbols[currency] || (currency + ' ');
        return symbol + ALO.formatNumber(value, 2);
    };

    ALO.formatDate = function (value, fmt) {
        if (!value) return '';
        var d = (value instanceof Date) ? value : new Date(value);
        if (isNaN(d.getTime())) return '';
        fmt = fmt || 'M d, Y';
        // PHP-style format tokens
        var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var monthsFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        return fmt
            .replace(/Y/g, d.getFullYear())
            .replace(/y/g, String(d.getFullYear()).slice(-2))
            .replace(/M/g, months[d.getMonth()])
            .replace(/F/g, monthsFull[d.getMonth()])
            .replace(/n/g, (d.getMonth() + 1))
            .replace(/m/g, pad(d.getMonth() + 1))
            .replace(/d/g, pad(d.getDate()))
            .replace(/j/g, d.getDate())
            .replace(/H/g, pad(d.getHours()))
            .replace(/i/g, pad(d.getMinutes()))
            .replace(/s/g, pad(d.getSeconds()))
            .replace(/A/g, d.getHours() >= 12 ? 'PM' : 'AM')
            .replace(/g/g, ((d.getHours() + 11) % 12) + 1);
    };

    ALO.timeAgo = function (value) {
        if (!value) return '';
        var d = (value instanceof Date) ? value : new Date(value);
        if (isNaN(d.getTime())) return '';
        var seconds = Math.floor((Date.now() - d.getTime()) / 1000);
        if (seconds < 60)    return 'just now';
        var minutes = Math.floor(seconds / 60);
        if (minutes < 60)    return minutes + ' min ago';
        var hours = Math.floor(minutes / 60);
        if (hours < 24)      return hours + ' h ago';
        var days = Math.floor(hours / 24);
        if (days < 7)        return days + ' d ago';
        if (days < 30)       return Math.floor(days / 7) + ' wk ago';
        return ALO.formatDate(d, 'M d, Y');
    };

    /* ------------------------------------------------------------
       11. Tabs helper
       ------------------------------------------------------------ */
    ALO.initTabs = function (container) {
        var root = typeof container === 'string' ? document.querySelector(container) : container;
        if (!root) return;
        var tabs = root.querySelectorAll('.tabs .tab');
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                tabs.forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                var target = tab.getAttribute('data-tab');
                if (target) {
                    root.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
                    var panel = root.querySelector('#' + target);
                    if (panel) panel.classList.add('active');
                }
            });
        });
    };

    /* ------------------------------------------------------------
       12. Dropdown helper
       ------------------------------------------------------------ */
    ALO.initDropdowns = function () {
        document.querySelectorAll('.dropdown > [data-toggle="dropdown"]').forEach(function (trigger) {
            trigger.addEventListener('click', function (e) {
                e.preventDefault();
                var parent = trigger.closest('.dropdown');
                // Close others
                document.querySelectorAll('.dropdown.open').forEach(function (d) {
                    if (d !== parent) d.classList.remove('open');
                });
                parent.classList.toggle('open');
            });
        });
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown.open').forEach(function (d) { d.classList.remove('open'); });
            }
        });
    };

    /* ------------------------------------------------------------
       13. Table sort helper
       ------------------------------------------------------------ */
    ALO.initTableSort = function (table) {
        var t = typeof table === 'string' ? document.querySelector(table) : table;
        if (!t) return;
        var headers = t.querySelectorAll('th.sortable');
        headers.forEach(function (th, idx) {
            th.addEventListener('click', function () {
                var order = th.classList.contains('sort-asc') ? 'desc' : 'asc';
                headers.forEach(function (h) { h.classList.remove('sort-asc', 'sort-desc'); });
                th.classList.add('sort-' + order);

                var tbody = t.querySelector('tbody');
                var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
                rows.sort(function (a, b) {
                    var av = a.children[idx] ? a.children[idx].textContent.trim() : '';
                    var bv = b.children[idx] ? b.children[idx].textContent.trim() : '';
                    var an = parseFloat(av.replace(/[^0-9.\-]/g, ''));
                    var bn = parseFloat(bv.replace(/[^0-9.\-]/g, ''));
                    if (!isNaN(an) && !isNaN(bn)) {
                        return order === 'asc' ? an - bn : bn - an;
                    }
                    return order === 'asc'
                        ? av.localeCompare(bv)
                        : bv.localeCompare(av);
                });
                rows.forEach(function (r) { tbody.appendChild(r); });
            });
        });
    };

    /* ------------------------------------------------------------
       14. Auto-init on DOMContentLoaded
       ------------------------------------------------------------ */
    function autoInit() {
        // Sidebar toggle button
        var menuBtn = document.querySelector('.menu-toggle');
        if (menuBtn) menuBtn.addEventListener('click', ALO.toggleSidebar);

        // Dropdowns
        ALO.initDropdowns();

        // Tabs
        document.querySelectorAll('[data-tabs]').forEach(function (c) { ALO.initTabs(c); });

        // Table sort
        document.querySelectorAll('table.data-table, .table[data-sortable]').forEach(function (t) {
            ALO.initTableSort(t);
        });

        // Modal close buttons (delegated)
        document.addEventListener('click', function (e) {
            var closeBtn = e.target.closest('[data-close="modal"]');
            if (closeBtn) {
                var modal = closeBtn.closest('.modal-overlay');
                if (modal) ALO.closeModal(modal);
            }
            var drawerClose = e.target.closest('[data-close="drawer"]');
            if (drawerClose) ALO.closeDrawer(drawerClose.closest('.drawer'));

            // Click on overlay closes modal
            if (e.target.classList && e.target.classList.contains('modal-overlay')) {
                ALO.closeModal(e.target);
            }
        });

        // ESC closes modals & drawers
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                ALO.closeAllModals();
                ALO.closeDrawer();
                var sidebar = document.querySelector('.sidebar.open');
                if (sidebar) ALO.toggleSidebar();
            }
        });

        // Auto-mark forms for AJAX submission if [data-ajax] is set
        document.querySelectorAll('form[data-ajax]').forEach(function (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                ALO.submitForm(form, null, {
                    successMessage: form.getAttribute('data-success-message') || 'Saved successfully.',
                    redirect:       form.getAttribute('data-redirect'),
                    resetOnSuccess: form.hasAttribute('data-reset')
                });
            });
        });

        // Confirm actions via [data-confirm]
        document.addEventListener('click', function (e) {
            var link = e.target.closest('[data-confirm]');
            if (!link) return;
            e.preventDefault();
            var msg   = link.getAttribute('data-confirm') || 'Are you sure?';
            var title = link.getAttribute('data-confirm-title') || 'Please Confirm';
            var danger = link.hasAttribute('data-confirm-danger');
            var href = link.getAttribute('href');
            ALO.confirmAction(msg, { title: title, danger: danger, confirmText: link.getAttribute('data-confirm-text') || 'Confirm' }, function (ok) {
                if (!ok) return;
                if (link.getAttribute('data-method') === 'post') {
                    var form = document.createElement('form');
                    form.method = 'POST';
                    form.action = href || window.location.href;
                    var csrf = document.createElement('input');
                    csrf.type = 'hidden';
                    csrf.name = ALO.csrfName;
                    csrf.value = ALO.csrfToken;
                    form.appendChild(csrf);
                    document.body.appendChild(form);
                    form.submit();
                } else if (href && href !== '#') {
                    window.location.href = href;
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }

    /* ------------------------------------------------------------
       15. Public API exposure
       ------------------------------------------------------------ */
    // Expose shorthand global functions for non-module usage
    window.aloFetch         = ALO.aloFetch;
    window.openModal       = ALO.openModal;
    window.closeModal      = ALO.closeModal;
    window.openDrawer      = ALO.openDrawer;
    window.closeDrawer     = ALO.closeDrawer;
    window.showToast       = ALO.showToast;
    window.confirmAction   = ALO.confirmAction;
    window.submitForm      = ALO.submitForm;
    window.tableSearch     = ALO.tableSearch;

})();

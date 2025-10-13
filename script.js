// ---===[ 1. الإعدادات العامة و Firebase ]===---
const firebaseConfig = {
    apiKey: "AIzaSyAqiR1mwkp13nryH_6UYXp1-whAoW6TRPw",
    authDomain: "north-riyadh.firebaseapp.com",
    projectId: "north-riyadh",
    storageBucket: "north-riyadh.appspot.com",
    messagingSenderId: "789464858729",
    appId: "1:789464858729:web:e6a2b887761670103f22f8"
};

const config = {
    initialView: { center: [23.8859, 45.0792], zoom: 6 },
    defaultCityZoom: 11,
    zoomThresholds: { cityToOpportunities: 10, opportunitiesToCity: 9 },
    maxDistanceForCitySwitch: 150000,
    currencySymbolHtml: `<img src="img/Saudi_Riyal_Symbol.png" alt="SAR" class="currency-symbol">`,
    mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    superAdmin: { username: 'samer', password: '100200' },
    approvedCities: ['الرياض', 'جدة', 'المدينة', 'أبها', 'الخبر', 'حائل'],
    baseFields: {
        main: {
            opportunity_date: { label: 'تاريخ الفرصة', icon: 'fa-calendar-alt', type: 'date', order: 1 },
            opportunity_type: { label: 'نوع الفرصة', icon: 'fa-landmark', type: 'select', options: ['بنية تحتية', 'بنية فوقية', 'تعليمي', 'لوجستي', 'فندقي', 'أخر'], order: 2 },
            area: { label: 'المساحة', icon: 'fa-vector-square', type: 'number', unit: 'م²', order: 3 },
            buy_price_sqm: { label: 'سعر المتر', icon: 'fa-dollar-sign', type: 'number', isCurrency: true, order: 4 },
            total_cost: { label: 'التكلفة الإجمالية', icon: 'fa-money-bill-wave', type: 'number', isCurrency: true, isHighlight: true, readonly: true, order: 5 },
        },
        study: {
            dev_cost: { label: 'تكاليف التطوير', icon: 'fa-hard-hat', type: 'number', isCurrency: true, order: 1 },
            design_cost: { label: 'تكاليف التصميم', icon: 'fa-drafting-compass', isCurrency: true, order: 2 },
            execution_cost: { label: 'تكاليف التنفيذ', icon: 'fa-tools', isCurrency: true, order: 3 },
            roi: { label: 'العائد (ROI)', icon: 'fa-chart-line', unit: '%', order: 4 },
            irr: { label: 'العائد الداخلي (IRR)', icon: 'fa-percentage', unit: '%', order: 5 },
        }
    },
    internalFields: {
         name: { label: 'اسم الفرصة', icon: 'fa-tag', type: 'text', required: true, section: 'main' },
         city: { label: 'المدينة', icon: 'fa-city', type: 'select', required: true, section: 'main' },
         coords: { label: 'الإحداثيات', icon: 'fa-map-marker-alt', type: 'text', required: true, section: 'main' },
         status: { label: 'نتيجة دراسة الفرصة', icon: 'fa-tasks', type: 'select', options: ['مناسبة', 'غير مناسبة', 'تم الاستحواذ'], section: 'main' },
    },
    suggestedFields: {
        development_type: { label: 'نوع التطوير', icon: 'fa-cogs', type: 'select', options: ['تطوير ذاتي', 'شراكة', 'صندوق عقاري', 'تطوير للغير', 'أخر'], section: 'main' },
        gmaps_link: { label: 'رابط خرائط جوجل', icon: 'fa-link', type: 'text', section: 'main' },
        notes: { label: 'تفاصيل إضافية', icon: 'fa-align-left', type: 'textarea', isFullWidth: true, section: 'main' },
        district: { label: 'الحي', icon: 'fa-map-signs', section: 'main' },
        dev_cost_unit: { label: 'وحدة تكلفة التطوير', icon: 'fa-ruler-combined', section: 'study' },
        other_costs: { label: 'تكاليف أخرى', icon: 'fa-coins', isCurrency: true, section: 'study' },
        est_sales: { label: 'المبيعات المقدرة', icon: 'fa-cash-register', isCurrency: true, isHighlight: true, section: 'study' },
    }
};

// ---===[ 2. حالة التطبيق (State) ]===---
const state = {
    map: null,
    opportunitiesData: [],
    citiesData: [],
    cityMarkers: [],
    displayedOpportunityMarkers: [],
    currentCityFilter: 'all',
    currentStatusFilter: 'all',
    activeMarkerWrapperElement: null,
    activeCityListItem: null,
    currentViewMode: 'cities',
    cityListForMarkers: [],
    dom: {},
    db: null,
    auth: null,
    functions: null,
    storage: null,
    opportunitiesCollection: null,
    citiesCollection: null,
    usersCollection: null,
    auditLogCollection: null,
    knowledgeFilesCollection: null,
    unsubscribeOpps: null,
    unsubscribeCities: null,
    isEditMode: false,
    isLocationEditMode: false,
    sortableInstances: { main: null, study: null },
    modalSortableInstances: { main: null, study: null },
    currentUser: null,
    locationUpdateListener: null,
    editBuffer: null,
    hasStructuralChanges: false,
    chatHistory: [],
    knowledgeFiles: [],
};

// ---===[ 3. الدوال المساعدة (Utilities / Helpers) ]===---
let isCitiesDataLoaded = false;
let isOppsDataLoaded = false;

const cacheDomElements = () => {
    state.dom = {
        loadingScreen: document.getElementById('loading-screen'),
        mapContainer: document.getElementById('map-container'),
        mapElement: document.getElementById('map'),
        mapSelectionPin: document.getElementById('map-selection-pin'),
        locationEditor: document.getElementById('location-editor'),
        coordsEditorInput: document.getElementById('coords-editor-input'),
        applyCoordsBtn: document.getElementById('apply-coords-btn'),
        confirmLocationBtn: document.getElementById('confirm-location-btn'),
        cancelLocationBtn: document.getElementById('cancel-location-btn'),
        cityNavigatorList: document.getElementById('city-list'),
        infoCard: document.getElementById('info-card'),
        infoCardCloseBtn: document.getElementById('info-card-close'),
        infoCardTitle: document.getElementById('info-card-title'),
        infoCardStatusBadge: document.getElementById('info-card-status-badge'),
        infoCardDetailsContainer: document.getElementById('info-card-details'),
        infoCardGmapsLink: document.getElementById('info-card-gmaps-link'),
        cityNavigatorPanel: document.getElementById('city-navigator'),
        statusFilterDiv: document.getElementById('city-navigator')?.querySelector('.status-filters'),
        navigatorLegend: document.getElementById('navigator-legend'),
        addOpportunityBtn: document.getElementById('add-opportunity-btn'),
        opportunityModal: document.getElementById('opportunity-modal'),
        opportunityForm: document.getElementById('opportunity-form'),
        mainInfoGrid: document.getElementById('main-info-grid'),
        studyInfoGrid: document.getElementById('study-info-grid'),
        addDynamicFieldBtn: document.getElementById('add-dynamic-field-btn'),
        modalTitle: document.getElementById('modal-title'),
        addFieldModal: document.getElementById('add-field-modal'),
        addFieldForm: document.getElementById('add-field-form'),
        fieldKeySelect: document.getElementById('field-key-select'),
        customFieldGroup: document.getElementById('custom-field-group'),
        fieldKeyCustom: document.getElementById('field-key-custom'),
        fieldLabelInput: document.getElementById('field-label'),
        applyScopeModal: document.getElementById('apply-scope-modal'),
        applyScopeOneBtn: document.getElementById('apply-scope-one'),
        applyScopeAllBtn: document.getElementById('apply-scope-all'),
        passwordModal: document.getElementById('password-modal'),
        passwordForm: document.getElementById('password-form'),
        usernameInput: document.getElementById('username-input'),
        passwordInput: document.getElementById('password-input'),
        passwordCancelBtn: document.getElementById('password-cancel-btn'),
        infoCardActions: document.getElementById('info-card-actions'),
        actionButtonsContainer: document.querySelector('#info-card-actions .action-buttons'),
        adminPanelBtn: document.getElementById('admin-panel-btn'),
        adminPanelModal: document.getElementById('admin-panel-modal'),
        addUserForm: document.getElementById('add-user-form'),
        usersListContainer: document.getElementById('users-list-container'),
        auditLogContainer: document.getElementById('audit-log-container'),
        logDateFilter: document.getElementById('log-date-filter'),
        clearLogFilterBtn: document.getElementById('clear-log-filter-btn'),
        zoomInBtn: document.getElementById('zoom-in-btn'),
        zoomOutBtn: document.getElementById('zoom-out-btn'),
        zoomAllBtn: document.getElementById('zoom-all-btn'),
        cityNumberModal: document.getElementById('city-number-modal'),
        cityNumberForm: document.getElementById('city-number-form'),
        newCityNameSpan: document.getElementById('new-city-name-span'),
        cityDisplayIdInput: document.getElementById('city-display-id-input'),
        editCityNumberModal: document.getElementById('edit-city-number-modal'),
        editCityNumberForm: document.getElementById('edit-city-number-form'),
        editCityNameSpan: document.getElementById('edit-city-name-span'),
        editCityDisplayIdInput: document.getElementById('edit-city-display-id-input'),
        editCityNameHidden: document.getElementById('edit-city-name-hidden'),
        customConfirmModal: document.getElementById('custom-confirm-modal'),
        customConfirmTitle: document.getElementById('custom-confirm-title'),
        customConfirmMessage: document.getElementById('custom-confirm-message'),
        customConfirmOkBtn: document.getElementById('custom-confirm-ok-btn'),
        customConfirmCancelBtn: document.getElementById('custom-confirm-cancel-btn'),
        chatbotFab: document.getElementById('chatbot-fab'),
        chatbotContainer: document.getElementById('chatbot-container'),
        chatbotCloseBtn: document.getElementById('chatbot-close-btn'),
        chatbotSettingsBtn: document.getElementById('chatbot-settings-btn'),
        chatbotMessages: document.getElementById('chatbot-messages'),
        chatbotForm: document.getElementById('chatbot-form'),
        chatbotInput: document.getElementById('chatbot-input'),
        chatbotCallout: document.getElementById('chatbot-callout'),
        closeCalloutBtn: document.getElementById('close-callout-btn'),
        chatbotSettingsModal: document.getElementById('chatbot-settings-modal'),
        chatbotSettingsForm: document.getElementById('chatbot-settings-form'),
        knowledgeBaseInput: document.getElementById('knowledge-base-input'),
        fileUploadInput: document.getElementById('file-upload-input'),
        knowledgeFilesContainer: document.getElementById('knowledge-files-container'),
    };
    state.dom.statusFilterButtons = state.dom.statusFilterDiv ? Array.from(state.dom.statusFilterDiv.querySelectorAll('button')) : [];
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.currentTarget.dataset.modalId;
            if(modalId) {
                const modal = document.getElementById(modalId);
                if(modal) modal.classList.remove('visible');
            }
        });
    });
    return !!state.dom.mapElement;
};

const showCustomConfirm = (message, title = 'تأكيد', isAlert = false) => {
    return new Promise((resolve) => {
        state.dom.customConfirmTitle.textContent = title;
        state.dom.customConfirmMessage.textContent = message;
        const actionsContainer = state.dom.customConfirmOkBtn.parentElement;

        if (isAlert) {
            actionsContainer.classList.add('is-alert');
        } else {
            actionsContainer.classList.remove('is-alert');
        }

        state.dom.customConfirmModal.classList.add('visible');

        const handleOk = () => {
            cleanup();
            resolve(true);
        };

        const handleCancel = () => {
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            state.dom.customConfirmOkBtn.removeEventListener('click', handleOk);
            state.dom.customConfirmCancelBtn.removeEventListener('click', handleCancel);
            state.dom.customConfirmModal.classList.remove('visible');
        };

        state.dom.customConfirmOkBtn.addEventListener('click', handleOk);
        state.dom.customConfirmCancelBtn.addEventListener('click', handleCancel);
    });
};

const requestAdminAccess = async (requiredRole = 'editor') => {
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        const hasAccess = user.role === 'admin' || (requiredRole === 'editor' && user.role === 'editor');
        if(hasAccess) {
            state.currentUser = user;
            return true;
        }
    }
    
    return new Promise(async (resolve) => {
        sessionStorage.removeItem('currentUser');
        state.currentUser = null;
        
        state.dom.passwordModal.classList.add('visible');
        state.dom.usernameInput.value = '';
        state.dom.passwordInput.value = '';
        state.dom.usernameInput.focus();

        const { getDocs, query, where } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");

        const handleSubmit = async (e) => {
            e.preventDefault();
            const username = state.dom.usernameInput.value;
            const password = state.dom.passwordInput.value;

            if (username === config.superAdmin.username && password === config.superAdmin.password) {
                state.currentUser = { username: config.superAdmin.username, role: 'admin' };
                sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));
                displayCityNavigator(); 
                cleanup();
                return resolve(true);
            }

            const q = query(state.usersCollection, where("username", "==", username), where("password", "==", password));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0].data();
                state.currentUser = { username: userDoc.username, role: userDoc.role };
                
                const hasAccess = state.currentUser.role === 'admin' || (requiredRole === 'editor' && state.currentUser.role === 'editor');
                if (hasAccess) {
                    sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));
                    displayCityNavigator();
                    cleanup();
                    resolve(true);
                } else {
                     await showCustomConfirm('ليس لديك الصلاحية الكافية للقيام بهذا الإجراء.', 'خطأ في الصلاحية', true);
                     cleanup();
                     resolve(false);
                }
            } else {
                await showCustomConfirm('اسم المستخدم أو كلمة المرور غير صحيحة.', 'خطأ في الدخول', true);
            }
        };

        const handleCancel = () => { cleanup(); resolve(false); };
        const cleanup = () => {
            state.dom.passwordForm.removeEventListener('submit', handleSubmit);
            state.dom.passwordCancelBtn.removeEventListener('click', handleCancel);
            state.dom.passwordModal.classList.remove('visible');
        };
        state.dom.passwordForm.addEventListener('submit', handleSubmit);
        state.dom.passwordCancelBtn.addEventListener('click', handleCancel);
    });
};

const parseNumberWithCommas = (value) => {
    if (value === null || value === undefined) return null;
    let strValue = String(value);

    strValue = strValue.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => d.charCodeAt(0) - 1632)
                       .replace(/[۰۱۲۳۴۵۶۷۸۹]/g, d => d.charCodeAt(0) - 1776);
    
    if (strValue.trim() === '') return null;
    const cleaned = strValue.replace(/[^0-9.-]/g, '');
    if (cleaned === '') return null;
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
};

const getAllFields = () => {
    return {
        ...Object.values(config.baseFields).reduce((acc, section) => ({ ...acc, ...section }), {}),
        ...config.internalFields,
        ...config.suggestedFields,
    };
};

const formatFieldValue = (key, value) => {
    const allFields = getAllFields();
    const field = allFields[key];
    if (!field || value === undefined || value === null || String(value).trim() === '') return value;

    let displayValue = value;
    if (field.isCurrency) {
        const num = parseNumberWithCommas(value);
        if (num !== null) displayValue = `${num.toLocaleString('en-US')} ${config.currencySymbolHtml}`;
    } else if (field.type === 'number') { 
        const num = parseNumberWithCommas(value);
        if (num !== null) displayValue = `${num.toLocaleString('en-US')}`;
    }
    if (field.unit && !field.isCurrency) {
        displayValue = `${displayValue}${field.unit}`;
    }
    return displayValue;
};

const createModalFormField = (key, fieldConfig, value) => {
    let inputHtml = '';
    const isReadonly = fieldConfig.readonly ? 'readonly' : '';
    let finalValue = value ?? '';

    if (fieldConfig.type === 'select') {
        const hasOther = fieldConfig.options && fieldConfig.options.includes('أخر');
        const isOther = hasOther && finalValue && !fieldConfig.options.includes(finalValue);
        
        let optionsHtml = `<option value="">--${fieldConfig.label === 'الحالة' || fieldConfig.label === 'نتيجة دراسة الفرصة' ? 'غير محدد' : 'غير محدد'}--</option>`;
        if (fieldConfig.options) {
             optionsHtml += fieldConfig.options.map(opt => `<option value="${opt}" ${(!isOther && finalValue === opt) || (isOther && opt === 'أخر') ? 'selected' : ''}>${opt}</option>`).join('');
        }
       
        inputHtml = `
            <select name="${key}" ${fieldConfig.required ? 'required' : ''}>${optionsHtml}</select>
            ${hasOther ? `<input type="text" name="other_${key}" class="other-input" placeholder="يرجى تحديد النوع" style="display: ${isOther ? 'block' : 'none'};" value="${isOther ? finalValue : ''}">` : ''}
        `;
    } else if (key === 'coords') {
        inputHtml = `
            <div class="input-with-button">
                <input type="${fieldConfig.type || 'text'}" name="${key}" value="${finalValue}" ${fieldConfig.required ? 'required' : ''}>
                <button type="button" id="pick-from-map-btn" class="gmaps-form-btn" title="تحديد من الخريطة"><i class="fas fa-map-marker-alt"></i></button>
            </div>`;
    } else {
        const inputType = (fieldConfig.type === 'number' && fieldConfig.readonly) ? 'text' : (fieldConfig.type || 'text');
        inputHtml = `<input type="${inputType}" name="${key}" value="${finalValue}" ${fieldConfig.required ? 'required' : ''} ${isReadonly}>`;
    }
    return `<div class="form-group ${fieldConfig.isFullWidth ? 'full-width' : ''}" data-field-key="${key}">
                <label>${fieldConfig.label}</label>
                ${inputHtml}
                <i class="fas fa-grip-vertical drag-handle"></i>
            </div>`;
};


const showOpportunityModal = (opportunity = null, prefillData = {}) => {
    state.dom.modalTitle.textContent = opportunity ? 'تحرير الفرصة' : 'إضافة فرصة جديدة';
    state.dom.opportunityForm.dataset.mode = opportunity ? 'edit' : 'add';
    state.dom.opportunityForm.dataset.docId = opportunity ? opportunity.id : '';
    state.dom.opportunityForm.reset();
    state.dom.mainInfoGrid.innerHTML = '';
    state.dom.studyInfoGrid.innerHTML = '';

    const allDefinedFields = { ...config.internalFields, ...config.suggestedFields, ...config.baseFields.main, ...config.baseFields.study };
    
    const opportunityFields = opportunity?.fieldOrder || {};
    const defaultFields = {
        main: Object.keys(config.baseFields.main).sort((a,b) => config.baseFields.main[a].order - config.baseFields.main[b].order),
        study: Object.keys(config.baseFields.study).sort((a,b) => config.baseFields.study[a].order - config.baseFields.study[b].order),
    };
    
    const fieldOrder = {
        main: opportunityFields.main || defaultFields.main,
        study: opportunityFields.study || defaultFields.study,
    };

    const internalFieldsToShow = ['name', 'city', 'coords', 'status'];
    internalFieldsToShow.forEach(key => {
        const fieldConfig = config.internalFields[key];
        if (fieldConfig) {
             let value = opportunity ? (key === 'coords' ? `${opportunity.coords?.latitude || ''},${opportunity.coords?.longitude || ''}` : opportunity[key]) : (prefillData[key] || '');
             if (key === 'coords' && prefillData.coords?.lat) {
                 value = `${prefillData.coords.lat.toFixed(6)},${prefillData.coords.lng.toFixed(6)}`;
             }
             state.dom.mainInfoGrid.innerHTML += createModalFormField(key, fieldConfig, value);
        }
    });

    ['main', 'study'].forEach(section => {
        fieldOrder[section].forEach(key => {
            let fieldConfig = allDefinedFields[key] || opportunity?.customFields?.[key];
            if (fieldConfig) {
                 let value = opportunity ? opportunity[key] : (prefillData[key] || '');
                 const targetGrid = section === 'main' ? state.dom.mainInfoGrid : state.dom.studyInfoGrid;
                 targetGrid.innerHTML += createModalFormField(key, fieldConfig, value);
            }
        });
    });
    
    const citySelectContainer = state.dom.mainInfoGrid.querySelector('[data-field-key="city"]');
    if (citySelectContainer) {
        const citySelect = citySelectContainer.querySelector('select');
        const cityValue = opportunity?.city || prefillData.city || '';
        const isOtherCity = cityValue && !config.approvedCities.includes(cityValue);
        let cityOptionsHtml = '<option value="">--غير محدد--</option>' + config.approvedCities.map(c => `<option value="${c}" ${!isOtherCity && cityValue === c ? 'selected' : ''}>${c}</option>`).join('');
        cityOptionsHtml += `<option value="other" ${isOtherCity ? 'selected' : ''}>مدينة أخرى...</option>`;
        
        if (citySelect) citySelect.innerHTML = cityOptionsHtml;
        
        document.getElementById('other-city-group')?.remove();

        const otherCityGroup = document.createElement('div');
        otherCityGroup.className = 'form-group full-width';
        otherCityGroup.id = 'other-city-group';
        otherCityGroup.style.display = isOtherCity ? 'grid' : 'none';
        otherCityGroup.innerHTML = `
            <label>اسم المدينة الجديدة</label>
            <input type="text" name="other_city" id="other-city-input" value="${isOtherCity ? cityValue : ''}">`;
        citySelectContainer.insertAdjacentElement('afterend', otherCityGroup);
        if (citySelect) {
            citySelect.addEventListener('change', (e) => {
                const otherGroup = document.getElementById('other-city-group');
                const otherInput = document.getElementById('other-city-input');
                if(e.target.value === 'other') {
                    otherGroup.style.display = 'grid';
                    otherInput.required = true;
                } else {
                    otherGroup.style.display = 'none';
                    otherInput.required = false;
                }
            });
        }
    }

    state.dom.opportunityModal.classList.add('visible');
    
    document.getElementById('pick-from-map-btn')?.addEventListener('click', () => {
        state.dom.opportunityModal.classList.remove('visible');
        startLocationEdit(true); 
    });

    state.dom.opportunityForm.querySelectorAll('select').forEach(select => {
        if (select.name !== 'city') {
             select.addEventListener('change', (e) => {
                const otherInput = e.target.closest('.form-group').querySelector('.other-input');
                if (otherInput) otherInput.style.display = e.target.value === 'أخر' ? 'block' : 'none';
            });
        }
    });
    
    const form = state.dom.opportunityForm;
    const areaInput = form.querySelector('input[name="area"]');
    const priceInput = form.querySelector('input[name="buy_price_sqm"]');
    const totalCostInput = form.querySelector('input[name="total_cost"]');

    if (areaInput && priceInput && totalCostInput) {
        const updateTotalCost = () => {
            const area = parseNumberWithCommas(areaInput.value) || 0;
            const price = parseNumberWithCommas(priceInput.value) || 0;
            const total = area * price;
            totalCostInput.value = total > 0 ? total.toLocaleString('en-US') : '';
        };
        
        areaInput.addEventListener('input', updateTotalCost);
        priceInput.addEventListener('input', updateTotalCost);
        updateTotalCost();
    }
    
    ['main', 'study'].forEach(section => {
        if (state.modalSortableInstances[section]) state.modalSortableInstances[section].destroy();
        const grid = section === 'main' ? state.dom.mainInfoGrid : state.dom.studyInfoGrid;
        state.modalSortableInstances[section] = new Sortable(grid, {
            animation: 200,
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
        });
    });
};

// ---===[ 4. دوال الخريطة والعلامات (Map & Markers) ]===---
const initializeMap = () => {
    try {
        state.map = L.map(state.dom.mapElement, { attributionControl: false, zoomControl: false }).setView(config.initialView.center, 6);
        L.tileLayer(config.mapTileUrl, { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(state.map);
        return true;
    } catch (e) { return false; }
};

const flyToCity = (cityName) => {
    if(cityName === 'all') {
        state.map.flyTo(config.initialView.center, config.initialView.zoom, { duration: 1.5 });
        return;
    }
    const cityData = state.cityListForMarkers.find(c => c.name === cityName);
    const view = cityData ? { center: cityData.coords, zoom: config.defaultCityZoom } : config.initialView;
    state.map.flyTo(view.center, view.zoom, { duration: 1.5 });
};

const zoomToShowMarkers = (coordsArray = []) => {
    if (!state.map || !state.dom.cityNavigatorPanel) return;
    if (coordsArray.length === 0) return flyToCity(state.currentCityFilter);
    const validCoords = coordsArray.filter(c => c && c.latitude).map(coord => [coord.latitude, coord.longitude]);
    if (validCoords.length === 0) return flyToCity(state.currentCityFilter);
    const bounds = L.latLngBounds(validCoords);
    state.map.flyToBounds(bounds, { paddingTopLeft: [40, state.dom.cityNavigatorPanel.offsetWidth + 40], paddingBottomRight: [40, 40], maxZoom: 16, duration: 1.0 });
};

const createOpportunityMarker = (opportunity, index) => {
    if (!opportunity?.coords?.latitude) return null;
    const iconHtml = `<div class="marker-icon-wrapper opportunity-marker" style="animation-delay: ${index * 50}ms;"><div class="custom-marker-icon">${index + 1}</div></div>`;
    const marker = L.marker([opportunity.coords.latitude, opportunity.coords.longitude], { icon: L.divIcon({ html: iconHtml, className: '', iconSize: [32, 32], iconAnchor: [16, 16] }) });
    marker.opportunityData = opportunity;
    marker.on('click', handleMarkerClick);
    marker.bindTooltip(opportunity.name, { direction: 'top', offset: [0, -18], sticky: true, className: 'opportunity-tooltip' });
    return marker;
};

const createCityMarker = (cityInfo) => {
    if (!cityInfo?.coords) return null;
    const iconHtml = `<div class="marker-icon-wrapper city-marker" style="animation-delay: ${cityInfo.displayId * 100}ms;"><div class="custom-marker-icon">${cityInfo.displayId}</div></div>`;
    const marker = L.marker(cityInfo.coords, { icon: L.divIcon({ html: iconHtml, className: '', iconSize: [38, 38], iconAnchor: [19, 19] }), zIndexOffset: 100 });
    marker.on('click', () => handleCityMarkerClick(cityInfo.name));
    return marker;
};

const clearAllMarkers = () => {
    [...state.displayedOpportunityMarkers, ...state.cityMarkers].forEach(marker => state.map.removeLayer(marker));
    state.displayedOpportunityMarkers = [];
    state.cityMarkers = [];
};

// ---===[ 5. دوال واجهة المستخدم (UI Functions) ]===---
const focusOnOpportunity = (opportunity) => {
    if (!opportunity || !opportunity.coords) return;

    const marker = state.displayedOpportunityMarkers.find(m => m.opportunityData.id === opportunity.id);
    if (marker && marker._icon) {
        if (state.activeMarkerWrapperElement) {
            state.activeMarkerWrapperElement.classList.remove('marker-selected');
        }
        marker._icon.classList.add('marker-selected');
        state.activeMarkerWrapperElement = marker._icon;
    }

    const latlng = [opportunity.coords.latitude, opportunity.coords.longitude];
    const targetZoom = Math.max(state.map.getZoom(), 16);
    const cardWidth = state.dom.infoCard.offsetWidth || 520;
    const offsetX = -(cardWidth / 2) - 80;

    const markerPoint = state.map.project(latlng, targetZoom);
    const newCenterPoint = markerPoint.add(new L.Point(offsetX, 0));
    const newCenterLatLng = state.map.unproject(newCenterPoint, targetZoom);

    state.map.flyTo(newCenterLatLng, targetZoom, { duration: 1.0 });

    showInfoCard(opportunity);
};

const addMessageToChat = (text, sender, isLoading = false) => {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);

    if (isLoading) {
        messageDiv.classList.add('loading-message');
        messageDiv.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    } else {
        messageDiv.innerHTML = marked.parse(text);
    }
    
    state.dom.chatbotMessages.appendChild(messageDiv);
    state.dom.chatbotMessages.scrollTop = state.dom.chatbotMessages.scrollHeight;
    return messageDiv;
};

const handleChatSubmit = async (e) => {
    e.preventDefault();
    const userInput = state.dom.chatbotInput.value.trim();
    if (!userInput) return;

    addMessageToChat(userInput, 'user');
    state.dom.chatbotInput.value = '';
    const loadingIndicator = addMessageToChat('', 'bot', true);

    const simplifiedData = state.opportunitiesData.map(opp => ({
        id: opp.id,
        name: opp.name,
        city: opp.city,
        status: opp.status,
        area: opp.area,
        total_cost: opp.total_cost,
        opportunity_type: opp.opportunity_type,
        development_type: opp.development_type,
        opportunity_date: opp.opportunity_date,
        roi: opp.roi,
        irr: opp.irr,
    }));

    const knowledgeBase = localStorage.getItem('knowledgeBase') || '';
    const fileRefs = state.knowledgeFiles.map(f => f.path);

    try {
        const { httpsCallable } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js");
        const askGemini = httpsCallable(state.functions, 'askGemini');
        const result = await askGemini({ 
            userInput: userInput,
            contextData: simplifiedData,
            knowledgeBase: knowledgeBase,
            fileRefs: fileRefs,
        });

        const botResponse = result.data.response || "عذراً، لم أتمكن من معالجة طلبك حالياً.";
        
        loadingIndicator.remove();
        addMessageToChat(botResponse, 'bot');

    } catch (error) {
        console.error("Firebase function error:", error);
        loadingIndicator.remove();
        let errorMessage = "حدث خطأ أثناء التواصل مع المساعد الذكي.";
        if (error.code === 'unavailable' || error.code === 'not-found') {
            errorMessage = "لا يمكن الوصول للخادم. يرجى التحقق من نشر الدالة السحابية بشكل صحيح.";
        } else if (error.message) {
            errorMessage += ` (${error.message})`;
        }
        addMessageToChat(errorMessage, 'bot');
    }
};

const showInfoCard = (opportunity) => {
    exitEditMode(false);
    state.dom.infoCard.classList.remove('visible');
    
    const statusDisplay = {
        'مناسبة': { text: 'مناسبة', class: 'suitable' },
        'غير مناسبة': { text: 'غير مناسبة', class: 'unsuitable' },
        'تم الاستحواذ': { text: 'تم الاستحواذ', class: 'acquired' },
    };

    setTimeout(() => {
        state.dom.infoCardTitle.textContent = opportunity.name || 'لا يوجد اسم';
        const status = opportunity.status || '';
        const display = statusDisplay[status] || { text: 'غير محدد', class: 'not-studied' };
        
        state.dom.infoCardStatusBadge.className = `status-badge status-${display.class}`;
        state.dom.infoCardStatusBadge.textContent = display.text;
        state.dom.infoCardDetailsContainer.innerHTML = '';

        const allDefinedFields = {
            ...config.baseFields.main, ...config.baseFields.study,
            ...config.internalFields, ...config.suggestedFields,
            ...(opportunity.customFields || {})
        };

        const fieldOrder = opportunity.fieldOrder || {
            main: Object.keys(config.baseFields.main).sort((a,b) => config.baseFields.main[a].order - config.baseFields.main[b].order),
            study: Object.keys(config.baseFields.study).sort((a,b) => config.baseFields.study[a].order - config.baseFields.study[b].order),
        };
        
        const createDetailItem = (key, field, value) => {
            if (!field || (value === undefined || value === null || String(value).trim() === '')) {
                return null;
            }
            const itemDiv = document.createElement('div');
            itemDiv.className = `detail-item ${field.isFullWidth ? 'notes-item' : ''} ${field.isHighlight && key !== 'total_cost' ? 'highlight-item' : ''}`;
            itemDiv.dataset.fieldKey = key;
            
            let displayValue = formatFieldValue(key, value);
            itemDiv.innerHTML = `
                <i class="item-icon fas ${field.icon || 'fa-info-circle'}"></i>
                <div class="item-content">
                    <div class="label">${field.label}</div>
                    <div class="value">${displayValue}</div>
                </div>
                <i class="fas fa-grip-vertical drag-handle-info-card"></i>
                <button class="delete-field-btn" data-field-key="${key}"><i class="fas fa-times"></i></button>`;
            return itemDiv;
        };

        const mainSectionDiv = document.createElement('div');
        mainSectionDiv.className = 'info-card-section';
        mainSectionDiv.innerHTML = `<h4><i class="fas fa-info-circle"></i> المعلومات الرئيسية</h4><div class="details-grid" id="details-grid-main"></div>`;
        const studySectionDiv = document.createElement('div');
        studySectionDiv.className = 'info-card-section';
        studySectionDiv.innerHTML = `<h4><i class="fas fa-clipboard-check"></i> دراسة الفرصة</h4><div class="details-grid" id="details-grid-study"></div>`;

        const mainGrid = mainSectionDiv.querySelector('#details-grid-main');
        const studyGrid = studySectionDiv.querySelector('#details-grid-study');

        // ** الإصلاح النهائي هنا **
        const allOpportunityKeys = Object.keys(opportunity);

        allOpportunityKeys.forEach(key => {
            const fieldDef = allDefinedFields[key];
            const value = opportunity[key];
            
            if (fieldDef && (value !== undefined && value !== null && String(value).trim() !== '')) {
                const item = createDetailItem(key, fieldDef, value);
                if (item) {
                    const section = fieldDef.section || 'main'; // Default to main if not specified
                    if (section === 'study') {
                        studyGrid.appendChild(item);
                    } else {
                        mainGrid.appendChild(item);
                    }
                }
            }
        });
        
        if (mainGrid.children.length > 0) {
            fieldOrder.main.forEach(key => {
                const item = mainGrid.querySelector(`[data-field-key="${key}"]`);
                if (item) mainGrid.appendChild(item);
            });
            state.dom.infoCardDetailsContainer.appendChild(mainSectionDiv);
        }
        if (studyGrid.children.length > 0) {
            fieldOrder.study.forEach(key => {
                const item = studyGrid.querySelector(`[data-field-key="${key}"]`);
                if (item) studyGrid.appendChild(item);
            });
            state.dom.infoCardDetailsContainer.appendChild(studySectionDiv);
        }
        
        const finalGmapsLink = opportunity.gmaps_link || (opportunity.coords ? `https://www.google.com/maps/search/?api=1&query=${opportunity.coords.latitude},${opportunity.coords.longitude}` : '#');
        state.dom.infoCardGmapsLink.href = finalGmapsLink;
        state.dom.infoCardActions.dataset.docId = opportunity.id;
        
        updateActionButtons();
        
        state.dom.infoCard.classList.add('visible');
    }, 100);
};


const hideInfoCard = (force = false) => {
    if (!force && state.isEditMode) return;
    exitEditMode(false);
    state.dom.infoCard.classList.remove('visible');
    if (state.activeMarkerWrapperElement) {
        state.activeMarkerWrapperElement.classList.remove('marker-selected');
        state.activeMarkerWrapperElement = null;
    }
    if (state.currentCityFilter === 'all') {
        flyToCity('all');
    } else {
        const cityOpps = state.opportunitiesData.filter(op => op.city === state.currentCityFilter);
        zoomToShowMarkers(cityOpps.map(op => op.coords));
    }
};

const displayCityNavigator = () => {
    state.dom.cityNavigatorList.innerHTML = '';
    const isAdmin = state.currentUser && state.currentUser.role === 'admin';
    if(isAdmin) {
        state.dom.cityNavigatorPanel.classList.add('admin-view');
    } else {
        state.dom.cityNavigatorPanel.classList.remove('admin-view');
    }

    const allLi = document.createElement('li');
    allLi.innerHTML = `<div class="city-info"><i class="fas fa-globe-asia" style="margin-left: 5px;"></i><span>كل المدن</span></div>`;
    allLi.dataset.city = 'all';
    allLi.addEventListener('click', handleCitySelection);
    state.dom.cityNavigatorList.appendChild(allLi);

    const sortedCities = [...state.cityListForMarkers].sort((a, b) => a.displayId - b.displayId);

    sortedCities.forEach((city) => {
        const li = document.createElement('li');
        const cityOpps = state.opportunitiesData.filter(op => op.city === city.name);
        const suitable = cityOpps.filter(op => op.status === 'مناسبة').length;
        const unsuitable = cityOpps.filter(op => op.status === 'غير مناسبة').length;
        const acquired = cityOpps.filter(op => op.status === 'تم الاستحواذ').length;
        const notStudied = cityOpps.filter(op => !op.status || op.status === '').length;
        li.dataset.city = city.name;
        li.innerHTML = `
            <div class="city-info">
                <span class="city-number">${city.displayId}</span>
                <span>${city.name}</span>
            </div>
            <button class="edit-city-btn" title="تعديل الرقم"><i class="fas fa-pencil-alt"></i></button>
            <div class="city-stats">
                <span class="stat-indicator suitable" title="مناسبة">${suitable}</span>
                <span class="stat-indicator unsuitable" title="غير مناسبة">${unsuitable}</span>
                <span class="stat-indicator acquired" title="تم الاستحواذ">${acquired}</span>
                <span class="stat-indicator not-studied" title="غير محدد">${notStudied}</span>
            </div>`;
        li.addEventListener('click', handleCitySelection);
        state.dom.cityNavigatorList.appendChild(li);
    });
    const activeLi = state.dom.cityNavigatorList.querySelector(`li[data-city="${state.currentCityFilter}"]`);
    if (activeLi) activeLi.classList.add('active');

    document.querySelectorAll('.edit-city-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const cityName = e.currentTarget.closest('li').dataset.city;
            handleEditCityNumberClick(cityName);
        });
    });

    const statusDisplay = {
        'مناسبة': { text: 'مناسبة', class: 'suitable' },
        'غير مناسبة': { text: 'غير مناسبة', class: 'unsuitable' },
        'تم الاستحواذ': { text: 'تم الاستحواذ', class: 'acquired' },
        '': { text: 'غير محدد', class: 'not-studied' }
    };
        state.dom.navigatorLegend.innerHTML = Object.values(statusDisplay)
        .map(s => `<div class="legend-item"><span class="legend-color ${s.class}"></span> ${s.text}</div>`)
        .join('');
};

const updateActionButtons = () => {
    const container = state.dom.actionButtonsContainer;
    container.innerHTML = '';

    if (state.isEditMode) {
        container.innerHTML = `
            <button id="main-edit-btn" class="action-btn edit-btn active"><i class="fas fa-check"></i> تم</button>
            <button id="share-opportunity-btn" class="action-btn"><i class="fas fa-share-alt"></i> مشاركة</button>
            <button id="edit-location-btn" class="action-btn edit-btn"><i class="fas fa-map-marker-alt"></i> تعديل الموقع</button>
            <button id="add-new-field-btn" class="action-btn add-field-btn"><i class="fas fa-plus-circle"></i> إضافة حقل</button>
            <button id="delete-opportunity-btn" class="action-btn delete-btn"><i class="fas fa-trash-alt"></i> حذف الفرصة</button>
        `;
        document.getElementById('main-edit-btn').addEventListener('click', () => exitEditMode(true));
        document.getElementById('edit-location-btn').addEventListener('click', () => startLocationEdit(false));
        document.getElementById('add-new-field-btn').addEventListener('click', () => handleAddNewField(null));
        document.getElementById('delete-opportunity-btn').addEventListener('click', handleDeleteOpportunity);
    } else {
        container.innerHTML = `
            <button id="main-edit-btn" class="action-btn edit-btn"><i class="fas fa-edit"></i> تحرير</button>
            <button id="share-opportunity-btn" class="action-btn"><i class="fas fa-share-alt"></i> مشاركة</button>
        `;
        document.getElementById('main-edit-btn').addEventListener('click', async () => {
            if (await requestAdminAccess('editor')) enterEditMode();
        });
    }

    document.getElementById('share-opportunity-btn').addEventListener('click', handleShareOpportunity);
    
    const deleteBtn = document.getElementById('delete-opportunity-btn');
    if (deleteBtn) {
        if (state.currentUser && state.currentUser.role === 'admin') {
            deleteBtn.classList.remove('hidden');
        } else {
            deleteBtn.classList.add('hidden');
        }
    }
};

// ---===[ 6. معالجات الأحداث (Event Handlers) ]===---

const handleMarkerClick = (e) => {
    focusOnOpportunity(e.target.opportunityData);
};

const handleCityMarkerClick = (cityName) => {
    state.dom.cityNavigatorList?.querySelector(`li[data-city="${cityName}"]`)?.click();
};

const handleCitySelection = (e) => {
    const selectedCity = e.currentTarget.dataset.city;
    if (state.currentCityFilter === selectedCity && state.currentViewMode !== 'cities') return;
    
    state.currentCityFilter = selectedCity;
    
    document.querySelectorAll('#city-list li').forEach(li => li.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    if (state.dom.infoCard.classList.contains('visible')) {
        hideInfoCard(true);
    }
    
    if (selectedCity === 'all') {
        state.currentViewMode = 'cities';
        document.querySelectorAll('#city-list li').forEach(li => li.style.display = 'flex');
        state.dom.cityNavigatorPanel?.classList.remove('show-status-filters');
        displayCityMarkers();
        flyToCity('all');
    } else {
        state.currentViewMode = 'opportunities';
        document.querySelectorAll('#city-list li').forEach(li => {
            const city = li.dataset.city;
            if (city !== 'all' && city !== selectedCity) {
                li.style.display = 'none';
            } else {
                 li.style.display = 'flex';
            }
        });
        state.dom.cityNavigatorPanel?.classList.add('show-status-filters');
        displayFilteredMarkers();
    }
};

const promptForNewCityNumber = (cityName) => {
    return new Promise((resolve, reject) => {
        state.dom.newCityNameSpan.textContent = cityName;
        state.dom.cityNumberModal.classList.add('visible');
        state.dom.cityDisplayIdInput.value = '';
        state.dom.cityDisplayIdInput.focus();

        const handleSubmit = async (e) => {
            e.preventDefault();
            const displayId = state.dom.cityDisplayIdInput.value;
            if (displayId && parseInt(displayId) > 0) {
                const existingId = state.citiesData.some(c => c.displayId === parseInt(displayId));
                if(existingId) {
                    await showCustomConfirm(`الرقم ${displayId} مستخدم لمدينة أخرى. الرجاء اختيار رقم مختلف.`, 'خطأ', true);
                    return;
                }
                cleanup();
                resolve(parseInt(displayId));
            } else {
                await showCustomConfirm("يرجى إدخال رقم صحيح أكبر من صفر.", 'خطأ', true);
            }
        };

        const handleClose = () => {
            cleanup();
            reject(new Error("User cancelled city number input."));
        };

        const cleanup = () => {
            state.dom.cityNumberForm.removeEventListener('submit', handleSubmit);
            state.dom.cityNumberModal.querySelector('.modal-close-btn').removeEventListener('click', handleClose);
            state.dom.cityNumberModal.classList.remove('visible');
        };

        state.dom.cityNumberForm.addEventListener('submit', handleSubmit);
        state.dom.cityNumberModal.querySelector('.modal-close-btn').addEventListener('click', handleClose);
    });
};

const handleEditCityNumberClick = (cityName) => {
    const cityData = state.citiesData.find(c => c.name === cityName);
    if (!cityData) return;
    
    state.dom.editCityNameSpan.textContent = cityName;
    state.dom.editCityNameHidden.value = cityName;
    state.dom.editCityDisplayIdInput.value = cityData.displayId;
    state.dom.editCityNumberModal.classList.add('visible');
    state.dom.editCityDisplayIdInput.focus();
};

const handleFormSubmit = async (e) => {
    e.preventDefault();
    const { addDoc, updateDoc, doc, GeoPoint, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
    
    const formToSubmit = e.target;
    const formData = new FormData(formToSubmit);
    const data = Object.fromEntries(formData.entries());
    
    let cityName = data.city === 'other' ? data.other_city : data.city;
    if (!cityName || cityName.trim() === '') {
        await showCustomConfirm('اسم المدينة مطلوب.', 'خطأ', true);
        return;
    }
    data.city = cityName;
    delete data.other_city;
    
    if (data.opportunity_type === 'أخر') data.opportunity_type = data.other_opportunity_type;
    delete data.other_opportunity_type;
    
    if (data.development_type === 'أخر') data.development_type = data.other_development_type;
    delete data.other_development_type;

    const { mode, docId } = formToSubmit.dataset;

    if (mode === 'add') {
        const cityExists = state.citiesData.some(city => city.name === cityName);
        if (!cityExists) {
            try {
                const displayId = await promptForNewCityNumber(cityName);
                const cityRef = doc(state.db, "cities", cityName);
                await setDoc(cityRef, { name: cityName, displayId: displayId });
            } catch (error) {
                console.log(error.message);
                return;
            }
        }
    }

    if (data.coords) {
        const [lat, lon] = data.coords.split(',').map(s => parseFloat(s.trim()));
        if (!isNaN(lat) && !isNaN(lon)) data.coords = new GeoPoint(lat, lon);
        else delete data.coords;
    }
    
    Object.keys(data).forEach(key => {
        const allFields = getAllFields();
        const fieldDef = allFields[key];
        if (fieldDef && fieldDef.type === 'number' && data[key]) {
            data[key] = parseNumberWithCommas(data[key]);
        }
        if (data[key] === '') {
            data[key] = null;
        }
    });
    
    data.fieldOrder = {
        main: [...state.dom.mainInfoGrid.children].map(el => el.dataset.fieldKey).filter(k => !config.internalFields[k]),
        study: [...state.dom.studyInfoGrid.children].map(el => el.dataset.fieldKey),
    };

    try {
        if (mode === 'add') {
             const docRef = await addDoc(state.opportunitiesCollection, data);
             await logAuditEvent('إضافة فرصة', { opportunityId: docRef.id, name: data.name });
             state.dom.opportunityModal.classList.remove('visible');
             await showCustomConfirm("تهانينا! تم إضافة الفرصة بنجاح.", 'نجاح', true);
        } else if (mode === 'edit' && docId) {
            await updateDoc(doc(state.db, 'opportunities', docId), data);
            await logAuditEvent('تعديل فرصة', { opportunityId: docId, name: data.name });
            state.dom.opportunityModal.classList.remove('visible');
        }

    } catch (error) { console.error(error); await showCustomConfirm('حدث خطأ أثناء حفظ البيانات.', 'خطأ', true); }
};

const handleDeleteOpportunity = async () => {
    if (!(await requestAdminAccess('admin'))) return;

    const docId = state.dom.infoCardActions.dataset.docId;
    const opportunity = state.opportunitiesData.find(op => op.id === docId);
    if (!opportunity) return;

    const confirmed = await showCustomConfirm(`هل أنت متأكد من حذف الفرصة "${opportunity.name}"؟\nلا يمكن التراجع عن هذا الإجراء.`);
    if (confirmed) {
        const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
        try {
            await deleteDoc(doc(state.db, 'opportunities', docId));
            hideInfoCard(true);
            await logAuditEvent('حذف فرصة', { opportunityId: docId, name: opportunity.name });
            await showCustomConfirm("تم حذف الفرصة بنجاح.", 'نجاح', true);
        } catch (error) {
            console.error("Error deleting opportunity: ", error);
            await showCustomConfirm("فشل حذف الفرصة.", 'خطأ', true);
        }
    }
};

const handleZoomEnd = () => {
    if (!state.map) return;
    const currentZoom = state.map.getZoom();

    if (state.currentViewMode === 'opportunities' && currentZoom < config.zoomThresholds.opportunitiesToCity) {
        const allCitiesLi = state.dom.cityNavigatorList.querySelector('li[data-city="all"]');
        if (allCitiesLi) allCitiesLi.click();
    } else if (state.currentViewMode === 'cities' && currentZoom >= config.zoomThresholds.cityToOpportunities) {
        const mapCenter = state.map.getCenter();
        let closestCity = null;
        let minDist = Infinity;
        
        state.cityListForMarkers.forEach(cityInfo => {
            if (cityInfo.coords) {
                const dist = mapCenter.distanceTo(L.latLng(cityInfo.coords));
                if (dist < minDist) {
                    minDist = dist;
                    closestCity = cityInfo;
                }
            }
        });

        if (closestCity && minDist < config.maxDistanceForCitySwitch) {
            const cityLi = state.dom.cityNavigatorList.querySelector(`li[data-city="${closestCity.name}"]`);
            if (cityLi) cityLi.click();
        }
    }
};

const handleFileUpload = async (e) => {
    const { ref, uploadBytes } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js");
    const { addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
    const file = e.target.files[0];
    if (!file) return;

    if (!state.auth.currentUser) {
        await showCustomConfirm("يجب تسجيل الدخول لرفع الملفات.", "خطأ", true);
        return;
    }

    const loadingMsg = addMessageToChat(`جاري رفع الملف: ${file.name}...`, 'bot', true);

    try {
        const filePath = `knowledge_files/${state.auth.currentUser.uid}/${Date.now()}_${file.name}`;
        const fileRef = ref(state.storage, filePath);
        await uploadBytes(fileRef, file);
        
        await addDoc(state.knowledgeFilesCollection, {
            name: file.name,
            path: filePath,
            size: file.size,
            type: file.type,
            createdAt: serverTimestamp(),
            userId: state.auth.currentUser.uid,
        });
        
        loadingMsg.remove();
        addMessageToChat(`تم رفع الملف "${file.name}" بنجاح. يمكنك الآن طرح أسئلة حوله.`, 'bot');
    } catch (error) {
        console.error("File upload error:", error);
        loadingMsg.remove();
        addMessageToChat(`فشل رفع الملف. يرجى المحاولة مرة أخرى.`, 'bot');
    } finally {
        e.target.value = ''; // Reset input
    }
};

const handleShareOpportunity = async () => {
    const docId = state.dom.infoCardActions.dataset.docId;
    if (!docId) {
        await showCustomConfirm('فشل نسخ الرابط، لم يتم العثور على معرّف الفرصة.', 'خطأ', true);
        return;
    }

    const url = new URL(window.location.href);
    url.search = `?opportunity=${docId}`;
    const shareUrl = url.href;

    const textArea = document.createElement("textarea");
    textArea.value = shareUrl;

    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (!successful) {
            throw new Error('execCommand returned false');
        }
        await showCustomConfirm('تم نسخ رابط المشاركة بنجاح!', 'تم النسخ', true);
    } catch (err) {
        console.error('Copying failed:', err);
        await showCustomConfirm(`فشل النسخ التلقائي. يرجى نسخ الرابط يدوياً:\n\n${shareUrl}`, 'انسخ الرابط', true);
    }

    document.body.removeChild(textArea);
};

// ---===[ 7. دوال العرض والفلترة الرئيسية ]===---

const displayFilteredMarkers = () => {
    clearAllMarkers();
    const filteredData = state.opportunitiesData.filter(op => {
        const cityMatch = op.city === state.currentCityFilter;
        const statusMatch = state.currentStatusFilter === 'all' || op.status === state.currentStatusFilter || (state.currentStatusFilter === '' && !op.status);
        return cityMatch && statusMatch;
    });

    filteredData.sort((a, b) => (a.area || 0) - (b.area || 0));

    const coords = [];
    filteredData.forEach((opportunity, index) => {
        const marker = createOpportunityMarker(opportunity, index);
        if (marker) {
            marker.addTo(state.map);
            state.displayedOpportunityMarkers.push(marker);
            coords.push(opportunity.coords);
        }
    });
    zoomToShowMarkers(coords);
};

const displayCityMarkers = () => {
    clearAllMarkers();
    state.cityListForMarkers.forEach(cityInfo => {
        const marker = createCityMarker(cityInfo);
        if (marker) {
            marker.addTo(state.map);
            state.cityMarkers.push(marker);
        }
    });
};

// ---===[ 8. دوال وضع التحرير المتقدم ]===---
const handleTitleClickToEdit = (e) => {
    if (!state.isEditMode) return;
    const titleEl = e.currentTarget;
    const currentOpportunity = state.opportunitiesData.find(op => op.id === state.dom.infoCardActions.dataset.docId);
    if (!currentOpportunity || titleEl.querySelector('input')) return;

    const originalTitle = currentOpportunity.name;
    titleEl.innerHTML = `<input type="text" value="${originalTitle}">`;
    const input = titleEl.querySelector('input');
    input.focus();
    input.select();

    const stageChange = () => {
        const newTitle = input.value.trim();
        titleEl.textContent = newTitle || originalTitle; 
        if (newTitle && newTitle !== originalTitle) {
            state.editBuffer.name = newTitle;
        } else {
            delete state.editBuffer.name;
        }
    };
    input.addEventListener('blur', stageChange);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
};

const handleStatusClickToEdit = (e) => {
    if (!state.isEditMode) return;
    const badgeEl = e.currentTarget;
    const currentOpportunity = state.opportunitiesData.find(op => op.id === state.dom.infoCardActions.dataset.docId);
    if (!currentOpportunity || badgeEl.querySelector('select')) return;

    const originalStatus = currentOpportunity.status || '';
    const options = config.internalFields.status.options;
    let optionsHtml = '<option value="">--غير محدد--</option>' + options.map(opt => `<option value="${opt}" ${originalStatus === opt ? 'selected' : ''}>${opt}</option>`).join('');

    badgeEl.innerHTML = `<select>${optionsHtml}</select>`;
    const select = badgeEl.querySelector('select');
    select.focus();

    const stageChange = () => {
        const newStatus = select.value;
        const statusDisplay = { 'مناسبة': { text: 'مناسبة', class: 'suitable' }, 'غير مناسبة': { text: 'غير مناسبة', class: 'unsuitable' }, 'تم الاستحواذ': { text: 'تم الاستحواذ', class: 'acquired' } };
        const display = statusDisplay[newStatus] || { text: 'غير محدد', class: 'not-studied' };
        badgeEl.className = `status-badge status-${display.class}`;
        badgeEl.textContent = display.text;
        
        if (newStatus !== originalStatus) {
            state.editBuffer.status = newStatus || null;
        } else {
            delete state.editBuffer.status;
        }
    };
    select.addEventListener('blur', stageChange);
    select.addEventListener('change', stageChange);
};


const enterEditMode = () => {
    state.isEditMode = true;
    state.editBuffer = {};
    state.hasStructuralChanges = false;
    state.dom.infoCard.classList.add('edit-mode', 'header-editable');
    updateActionButtons();
    
    state.dom.infoCardDetailsContainer.querySelectorAll('.value').forEach(el => {
        el.addEventListener('click', handleValueClickToEdit);
    });

    state.dom.infoCardTitle.addEventListener('click', handleTitleClickToEdit);
    state.dom.infoCardStatusBadge.addEventListener('click', handleStatusClickToEdit);

    ['main', 'study'].forEach(section => {
        if (state.sortableInstances[section]) state.sortableInstances[section].destroy();
        const grid = document.getElementById(`details-grid-${section}`);
        if(grid) {
            state.sortableInstances[section] = new Sortable(grid, {
                animation: 150,
                handle: '.drag-handle-info-card',
                ghostClass: 'sortable-ghost',
                onEnd: () => { 
                    state.hasStructuralChanges = true;
                    state.editBuffer.fieldOrder = {
                        main: [...document.getElementById('details-grid-main').children].map(item => item.dataset.fieldKey),
                        study: [...document.getElementById('details-grid-study').children].map(item => item.dataset.fieldKey),
                    }
                },
            });
        }
    });
};

const exitEditMode = async (saveChanges = true) => {
    if (!state.isEditMode) return;
    state.isEditMode = false; // Set this first to prevent re-entry loops

    if (state.isLocationEditMode) {
        endLocationEdit(false);
    }

    const docId = state.dom.infoCardActions.dataset.docId;

    if (saveChanges && (Object.keys(state.editBuffer).length > 0 || state.hasStructuralChanges)) {
        if (state.hasStructuralChanges) {
            await promptForScopeAndApplyChanges(docId, state.editBuffer);
        } else {
            try {
                const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
                await updateDoc(doc(state.db, 'opportunities', docId), state.editBuffer);
                await logAuditEvent('تحديث حقول متعددة', { opportunityId: docId, changes: Object.keys(state.editBuffer) });
            } catch (error) {
                console.error("Failed to save changes:", error);
                await showCustomConfirm('فشل حفظ التعديلات.', 'خطأ', true);
            }
        }
    }

    state.editBuffer = null;
    state.hasStructuralChanges = false;
    state.dom.infoCard.classList.remove('edit-mode', 'header-editable');
    updateActionButtons();

    state.dom.infoCardTitle.removeEventListener('click', handleTitleClickToEdit);
    state.dom.infoCardStatusBadge.removeEventListener('click', handleStatusClickToEdit);
    
    ['main', 'study'].forEach(section => {
        if (state.sortableInstances[section]) {
            state.sortableInstances[section].destroy();
            state.sortableInstances[section] = null;
        }
    });

    if (!saveChanges) {
        const originalOpportunity = state.opportunitiesData.find(op => op.id === docId);
        if (originalOpportunity) {
            showInfoCard(originalOpportunity);
        }
    }
};

const handleValueClickToEdit = (e) => {
    const valueEl = e.currentTarget;
    if (valueEl.querySelector('input, select')) return; 

    const itemEl = valueEl.closest('.detail-item');
    const key = itemEl.dataset.fieldKey;
    const currentOpportunity = state.opportunitiesData.find(op => op.id === state.dom.infoCardActions.dataset.docId);
    let currentValue = currentOpportunity[key] || '';
    
    if(key === 'gmaps_link' && valueEl.querySelector('a')) {
        currentValue = valueEl.querySelector('a').getAttribute('href');
    }

    const allFields = { ...getAllFields(), ...(currentOpportunity.customFields || {}) };

    const stageChange = (newValue) => {
        let processedValue = newValue;
        const fieldConfig = allFields[key];
        if (fieldConfig && fieldConfig.type === 'number') {
            processedValue = parseNumberWithCommas(newValue);
        }
        
        const displayValue = (key === 'gmaps_link') ? `<a href="${processedValue}" target="_blank" class="value-link">${processedValue}</a>` : formatFieldValue(key, processedValue);
        
        if (String(processedValue) !== String(currentValue)) {
            state.editBuffer[key] = processedValue;
        } else {
            delete state.editBuffer[key];
        }
        
        valueEl.innerHTML = displayValue;

        if (key === 'area' || key === 'buy_price_sqm') {
            const area = parseNumberWithCommas(state.editBuffer.area ?? currentOpportunity.area) || 0;
            const price = parseNumberWithCommas(state.editBuffer.buy_price_sqm ?? currentOpportunity.buy_price_sqm) || 0;
            const totalCost = area * price;
            state.editBuffer['total_cost'] = totalCost;

            const totalCostValueEl = state.dom.infoCardDetailsContainer.querySelector(`[data-field-key="total_cost"] .value`);
            if (totalCostValueEl) {
                totalCostValueEl.innerHTML = formatFieldValue('total_cost', totalCost);
            }
        }
    };
    
    const fieldConfig = allFields[key];
    if (fieldConfig && fieldConfig.type === 'select') {
        const options = fieldConfig.options;
        const hasOtherOption = options.includes('أخر');
        const isOther = hasOtherOption && currentValue && !options.includes(currentValue);
        
        let optionsHtml = '<option value="">--غير محدد--</option>';
        optionsHtml += options.map(opt => `<option value="${opt}" ${(!isOther && currentValue === opt) || (isOther && opt === 'أخر') ? 'selected' : ''}>${opt}</option>`).join('');
        
        valueEl.innerHTML = `
            <select class="value-select">${optionsHtml}</select>
            ${hasOtherOption ? `<input class="value-input other-input" type="text" value="${isOther ? currentValue : ''}" style="margin-top: 5px; ${isOther ? '' : 'display: none;'}">` : ''}
        `;
        const select = valueEl.querySelector('select');
        const input = valueEl.querySelector('input');

        if(hasOtherOption) {
            select.onchange = () => { input.style.display = select.value === 'أخر' ? 'block' : 'none'; if(select.value === 'أخر') input.focus(); };
        }
        
        const saveSpecialFieldChange = () => {
            const newValue = (hasOtherOption && select.value === 'أخر') ? input.value : select.value;
            stageChange(newValue);
        };

        const handleBlur = (event) => {
            setTimeout(() => {
                if (document.activeElement !== select && document.activeElement !== input) {
                    saveSpecialFieldChange();
                }
            }, 100);
        };
        
        select.addEventListener('blur', handleBlur);
        if(input) input.addEventListener('blur', handleBlur);
        if(input) input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
        select.focus();

    } else {
        const inputType = fieldConfig.type === 'date' ? 'date' : 'text';
        valueEl.innerHTML = `<input class="value-input" type="${inputType}" value="${currentValue}">`;
        const input = valueEl.querySelector('input');
        input.focus();
        input.select(); 

        const handleBlur = () => stageChange(input.value);
        input.addEventListener('blur', handleBlur);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                input.blur(); 
            }
            if (e.key === 'Escape') {
                input.removeEventListener('blur', handleBlur);
                 valueEl.innerHTML = (key === 'gmaps_link') 
                    ? `<a href="${currentValue}" target="_blank" class="value-link">${currentValue}</a>`
                    : formatFieldValue(key, currentValue);
            }
        });
    }
};


const handleAddNewField = (targetFormGrid) => {
    state.dom.addFieldForm.reset();
    const select = state.dom.fieldKeySelect;
    const valueContainer = document.getElementById('field-value-container');
    select.innerHTML = '<option value="">--اختر حقلاً--</option>';
    
    const docId = state.dom.infoCardActions.dataset.docId;
    const opportunity = state.opportunitiesData.find(op => op.id === docId);

    const existingFields = new Set(Object.keys(opportunity || {}));

    for (const key in config.suggestedFields) {
        if(!existingFields.has(key)) {
            select.innerHTML += `<option value="${key}">${config.suggestedFields[key].label}</option>`;
        }
    }
    select.innerHTML += `<option value="custom">--حقل مخصص--</option>`;
    state.dom.customFieldGroup.classList.add('hidden');
    state.dom.fieldLabelInput.readOnly = true;
    valueContainer.innerHTML = `<label for="field-value">قيمة الحقل</label><input type="text" id="field-value" required>`;
    state.dom.addFieldModal.classList.add('visible');

    select.onchange = () => {
        const selectedKey = select.value;
        const fieldConfig = config.suggestedFields[selectedKey];
        valueContainer.innerHTML = '<label for="field-value">قيمة الحقل</label>';

        if (selectedKey === 'custom') {
            state.dom.customFieldGroup.classList.remove('hidden');
            state.dom.fieldLabelInput.value = '';
            state.dom.fieldLabelInput.readOnly = false;
            state.dom.fieldKeyCustom.focus();
            valueContainer.innerHTML += `<input type="text" id="field-value" required>`;
        } else if (selectedKey) {
            state.dom.customFieldGroup.classList.add('hidden');
            state.dom.fieldLabelInput.value = fieldConfig.label;
            state.dom.fieldLabelInput.readOnly = true;
            
            if (fieldConfig && fieldConfig.type === 'select' && fieldConfig.options) {
                let optionsHtml = '<option value="">--اختر--</option>' + fieldConfig.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
                valueContainer.innerHTML += `<select id="field-value" required>${optionsHtml}</select>`;
            } else {
                 const inputType = fieldConfig.type === 'date' ? 'date' : 'text';
                 valueContainer.innerHTML += `<input type="${inputType}" id="field-value" required>`;
            }

        } else {
             state.dom.fieldLabelInput.value = '';
             valueContainer.innerHTML += `<input type="text" id="field-value" required>`;
        }
    };
    
    state.dom.addFieldForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const selectedKey = select.value;
        const key = (selectedKey === 'custom' ? formData.get('field-key-custom') : selectedKey).trim();
        const label = formData.get('field-label');
        const value = formData.get('field-value');
        const section = formData.get('fieldSection');

        if (!key || !label || !value || !section) {
            await showCustomConfirm('يرجى تعبئة جميع الحقول.', 'خطأ', true);
            return;
        }
        
        const suggestedField = config.suggestedFields[key];
        const icon = selectedKey !== 'custom' ? (suggestedField?.icon || 'fa-plus-circle') : 'fa-plus-circle';
        
        const customFieldData = {
            label: label,
            icon: icon,
            type: suggestedField?.type || 'text',
            section: section,
        };
        if (suggestedField?.options) customFieldData.options = suggestedField.options;

        state.hasStructuralChanges = true;
        state.editBuffer[key] = value;
        state.editBuffer[`customFields.${key}`] = customFieldData;


        const itemDiv = document.createElement('div');
        itemDiv.className = `detail-item`;
        itemDiv.dataset.fieldKey = key;
        itemDiv.dataset.section = section;
        itemDiv.innerHTML = `
            <i class="item-icon fas ${icon}"></i>
            <div class="item-content">
                <div class="label">${label}</div>
                <div class="value">${formatFieldValue(key, value)}</div>
            </div>
            <i class="fas fa-grip-vertical drag-handle-info-card"></i>
            <button class="delete-field-btn" data-field-key="${key}"><i class="fas fa-times"></i></button>`;
            
        const targetGrid = document.getElementById(`details-grid-${section}`);
        targetGrid.appendChild(itemDiv);
        state.dom.addFieldModal.classList.remove('visible');

        state.editBuffer.fieldOrder = {
            main: [...document.getElementById('details-grid-main').children].map(item => item.dataset.fieldKey),
            study: [...document.getElementById('details-grid-study').children].map(item => item.dataset.fieldKey),
        };
    };
};

const handleDeleteField = async (fieldKey) => {
    const isBaseField = Object.keys(config.baseFields.main).includes(fieldKey) || Object.keys(config.baseFields.study).includes(fieldKey);
    if (isBaseField) {
        await showCustomConfirm("لا يمكن حذف الحقول الأساسية.", 'خطأ', true);
        return;
    }

    const { deleteField } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
    state.hasStructuralChanges = true;
    state.editBuffer[fieldKey] = deleteField();
    state.editBuffer[`customFields.${fieldKey}`] = deleteField();
    
    state.dom.infoCardDetailsContainer.querySelector(`[data-field-key="${fieldKey}"]`)?.remove();
    state.editBuffer.fieldOrder = {
        main: [...document.getElementById('details-grid-main').children].map(item => item.dataset.fieldKey),
        study: [...document.getElementById('details-grid-study').children].map(item => item.dataset.fieldKey),
    };
};

const applyStructureToAllOpportunities = async (structuralUpdates) => {
    await showCustomConfirm("سيتم تطبيق التغييرات الهيكلية على كافة الفرص. قد تستغرق العملية بعض الوقت.", 'تنبيه', true);
    const { getDocs, writeBatch, doc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
    try {
        const querySnapshot = await getDocs(state.opportunitiesCollection);
        const batch = writeBatch(state.db);
        
        querySnapshot.forEach(docSnap => {
            const docRef = doc(state.db, 'opportunities', docSnap.id);
            batch.update(docRef, structuralUpdates);
        });

        await batch.commit();
        await logAuditEvent('تغيير هيكل (كل الفرص)', { changes: Object.keys(structuralUpdates) });
        await showCustomConfirm("تم تطبيق التغييرات بنجاح على كل الفرص.", 'نجاح', true);
    } catch (error) {
        console.error("Error applying structure to all opportunities:", error);
        await showCustomConfirm("فشل تطبيق الهيكل على كل الفرص.", 'خطأ', true);
    }
};

const promptForScopeAndApplyChanges = (docId, allUpdates) => {
    return new Promise(async (resolve) => {
        state.dom.applyScopeModal.classList.add('visible');

        const { deleteField } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");

        const structuralUpdates = {};
        if (allUpdates.fieldOrder) {
            structuralUpdates.fieldOrder = allUpdates.fieldOrder;
        }
        for (const key in allUpdates) {
            if (key.startsWith('customFields.') || (allUpdates[key] && typeof allUpdates[key] === 'object' && allUpdates[key]._methodName === 'delete')) {
                structuralUpdates[key] = allUpdates[key];
                if(key.includes('.')) {
                   const plainKey = key.split('.')[1];
                   structuralUpdates[plainKey] = allUpdates[plainKey];
                }
            }
        }
        
        const handleOne = async () => {
            const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
            try {
                await updateDoc(doc(state.db, 'opportunities', docId), allUpdates);
                await logAuditEvent('تحديث فرصة مع تغيير هيكلي', { opportunityId: docId, changes: Object.keys(allUpdates) });
            } catch (error) {
                 await showCustomConfirm('فشل حفظ التعديلات.', 'خطأ', true);
            } finally {
                cleanup();
                resolve();
            }
        };

        const handleAll = async () => {
            const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
            try {
                 await updateDoc(doc(state.db, 'opportunities', docId), allUpdates);
            } catch (e) {
                console.error("Error saving current opportunity before batch update:", e);
                await showCustomConfirm('فشل حفظ التعديلات على الفرصة الحالية.', 'خطأ', true);
                cleanup();
                resolve();
                return;
            }
            
            await applyStructureToAllOpportunities(structuralUpdates);
            cleanup();
            resolve();
        };
        
        const cleanup = () => {
            state.dom.applyScopeOneBtn.onclick = null;
            state.dom.applyScopeAllBtn.onclick = null;
            state.dom.applyScopeModal.classList.remove('visible');
        };

        state.dom.applyScopeOneBtn.onclick = handleOne;
        state.dom.applyScopeAllBtn.onclick = handleAll;
    });
};


const startLocationEdit = (fromForm = false) => {
    state.isLocationEditMode = true;
    state.dom.locationEditor.dataset.fromForm = fromForm;
    if (!fromForm) {
        state.dom.infoCard.classList.remove('visible');
    }
    state.dom.mapSelectionPin.classList.remove('hidden');
    state.dom.locationEditor.classList.remove('hidden');
    state.dom.mapContainer.classList.add('location-edit-active');

    const updateCoordsInput = () => {
        const center = state.map.getCenter();
        state.dom.coordsEditorInput.value = `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`;
    };

    state.map.on('move', updateCoordsInput);
    updateCoordsInput(); 
};

const endLocationEdit = async (save = false) => {
    state.map.off('move');
    const fromForm = state.dom.locationEditor.dataset.fromForm === 'true';
    const docId = state.dom.infoCardActions.dataset.docId;
    const currentOpportunity = state.opportunitiesData.find(op => op.id === docId);
    
    const coordsFromInput = state.dom.coordsEditorInput.value;
    const [lat, lon] = coordsFromInput.split(',').map(s => parseFloat(s.trim()));
    
    if (save && !isNaN(lat) && !isNaN(lon)) {
        const newCoordsString = `${lat}, ${lon}`;
        if (fromForm) {
            const coordsInput = state.dom.opportunityForm.querySelector('input[name="coords"]');
            if (coordsInput) coordsInput.value = newCoordsString;
        } else if (docId) {
            const confirmed = await showCustomConfirm(`هل أنت متأكد من تحديث الموقع إلى: \n${newCoordsString}؟`);
            if (confirmed) {
                const { doc, updateDoc, GeoPoint } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
                const newCoords = new GeoPoint(lat, lon);
                try {
                    await updateDoc(doc(state.db, 'opportunities', docId), { coords: newCoords });
                    await logAuditEvent('تحديث الموقع', {
                        opportunityId: docId,
                        name: currentOpportunity.name,
                        newCoords: newCoordsString
                    });
                } catch(error) {
                    console.error("Failed to update location:", error);
                    await showCustomConfirm("فشل تحديث الموقع.", 'خطأ', true);
                }
            } else { 
                if (fromForm) state.dom.opportunityModal.classList.add('visible');
                else if (currentOpportunity) handleMarkerClick({ target: { _icon: null, opportunityData: currentOpportunity }, latlng: L.latLng(currentOpportunity.coords.latitude, currentOpportunity.coords.longitude) });
                
                state.isLocationEditMode = false;
                state.dom.mapSelectionPin.classList.add('hidden');
                state.dom.locationEditor.classList.add('hidden');
                state.dom.mapContainer.classList.remove('location-edit-active');
                return;
            }
        }
    }
    
    state.isLocationEditMode = false;
    state.dom.mapSelectionPin.classList.add('hidden');
    state.dom.locationEditor.classList.add('hidden');
    state.dom.mapContainer.classList.remove('location-edit-active');

    if (fromForm) {
        state.dom.opportunityModal.classList.add('visible');
    } else if (currentOpportunity) {
        const freshData = state.opportunitiesData.find(op => op.id === docId) || currentOpportunity;
         const marker = L.marker([freshData.coords.latitude, freshData.coords.longitude]);
         handleMarkerClick({ target: { _icon: null, opportunityData: freshData }, latlng: marker.getLatLng() });
    }
};

const panToCoordsFromInput = async () => {
    const coords = state.dom.coordsEditorInput.value.split(',').map(s => parseFloat(s.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        state.map.flyTo([coords[0], coords[1]], state.map.getZoom());
    } else {
        await showCustomConfirm('الرجاء إدخال الإحداثيات بصيغة صحيحة، مثال: 24.7136, 46.6753', 'خطأ', true);
    }
};


// ---===[ 9. دوال لوحة التحكم الجديدة ]===---
const generateLogMessage = (log) => {
    const { action, user, details } = log;
    let message = `قام <strong>${user}</strong> بـ `;

    switch (action) {
        case 'إضافة فرصة':
            message += `<strong>إضافة فرصة جديدة</strong> باسم "${details.name || details.opportunityId}"`;
            break;
        case 'تعديل فرصة':
             message += `<strong>تعديل بيانات أساسية</strong> للفرصة "${details.name || details.opportunityId}"`;
             break;
        case 'حذف فرصة':
             message += `<strong>حذف الفرصة</strong> "${details.name || details.opportunityId}"`;
             break;
        case 'تحديث حقل':
            message += `<strong>تحديث حقل</strong> "${details.field}" للفرصة "<strong>${details.opportunityName}</strong>".`;
            break;
        case 'تغيير هيكل (فرصة واحدة)':
            message += `<strong>تغيير هيكل الحقول</strong> للفرصة "${details.opportunityId}".`;
            break;
        case 'تغيير هيكل (كل الفرص)':
            message += `<strong>تغيير هيكل الحقول</strong> لجميع الفرص.`;
            break;
        case 'إضافة مستخدم':
            message += `<strong>إضافة مستخدم جديد</strong>: "${details.username}" بصلاحية "${details.role}".`;
            break;
        case 'حذف مستخدم':
            message += `<strong>حذف المستخدم</strong>: "${details.username}".`;
            break;
        case 'تحديث الموقع':
            message += `<strong>تحديث موقع</strong> الفرصة "${details.name}" إلى ${details.newCoords}.`;
            break;
        default:
            message += `<strong>${action}</strong>`;
    }
    return message;
};
const showAdminPanel = async () => {
    if (await requestAdminAccess('admin')) {
        state.dom.adminPanelModal.classList.add('visible');
        loadUsers();
        loadAuditLog(); 
    }
};

const handleDeleteUser = async (userId, username) => {
    if (username === config.superAdmin.username) {
        await showCustomConfirm('لا يمكن حذف المستخدم المسؤول.', 'خطأ', true);
        return;
    }
    const confirmed = await showCustomConfirm(`هل أنت متأكد من حذف المستخدم "${username}"؟ لا يمكن التراجع عن هذا الإجراء.`);
    if (confirmed) {
        const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
        try {
            await deleteDoc(doc(state.db, "users", userId));
            await logAuditEvent('حذف مستخدم', { username });
            loadUsers();
        } catch (error) {
            console.error("Error deleting user: ", error);
            await showCustomConfirm("فشل حذف المستخدم.", 'خطأ', true);
        }
    }
};

const loadUsers = async () => {
    const { getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
    const snapshot = await getDocs(state.usersCollection);
    state.dom.usersListContainer.innerHTML = '';
    snapshot.forEach(doc => {
        const user = doc.data();
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <div class="user-info">
                <span><i class="fas fa-user"></i> ${user.username}</span>
                <span class="role">${user.role}</span>
            </div>
            <button class="delete-user-btn" data-id="${doc.id}" data-username="${user.username}"><i class="fas fa-trash-alt"></i></button>
        `;
        state.dom.usersListContainer.appendChild(userItem);
    });

    document.querySelectorAll('.delete-user-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            handleDeleteUser(btn.dataset.id, btn.dataset.username);
        });
    });
};

const handleAddUser = async (e) => {
    e.preventDefault();
    const { addDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        await addDoc(state.usersCollection, data);
        await logAuditEvent('إضافة مستخدم', { username: data.username, role: data.role });
        e.target.reset();
        loadUsers();
    } catch(err) {
        await showCustomConfirm("فشل إضافة المستخدم.", 'خطأ', true);
    }
};

const loadAuditLog = async (filterDate = null) => {
    const { getDocs, query, orderBy, limit, where, Timestamp } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
    
    let q;
    if (filterDate) {
        const start = new Date(filterDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filterDate);
        end.setHours(23, 59, 59, 999);
        q = query(state.auditLogCollection, 
                  where("timestamp", ">=", Timestamp.fromDate(start)),
                  where("timestamp", "<=", Timestamp.fromDate(end)),
                  orderBy("timestamp", "desc"));
    } else {
        q = query(state.auditLogCollection, orderBy("timestamp", "desc"), limit(50));
    }
    
    const snapshot = await getDocs(q);
    state.dom.auditLogContainer.innerHTML = '';

    if(snapshot.empty) {
        state.dom.auditLogContainer.innerHTML = '<p>لا توجد سجلات لهذه الفترة.</p>';
        return;
    }

    snapshot.forEach(doc => {
        const log = doc.data();
        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        const date = log.timestamp?.toDate().toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) || '...';
        const message = generateLogMessage(log);
        logItem.innerHTML = `
            <div class="log-header">${message}</div>
            <div class="log-meta">${date}</div>
        `;
        state.dom.auditLogContainer.appendChild(logItem);
    });
};


// ---===[ 10. دالة التهيئة الرئيسية (Main Initialization) ]===---

const logAuditEvent = async (action, details) => {
    if (!state.currentUser) return;
    try {
        const { addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
        await addDoc(state.auditLogCollection, {
            action,
            details,
            user: state.currentUser.username,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Failed to log audit event:", error);
    }
};

const handleDeepLink = (retryCount = 0) => {
    if (retryCount > 5) {
        console.error("Deep link failed after multiple retries.");
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const opportunityId = urlParams.get('opportunity');
    if (!opportunityId) return;

    const opportunity = state.opportunitiesData.find(op => op.id === opportunityId);
    if (!opportunity) {
        if (retryCount < 3) {
            setTimeout(() => handleDeepLink(retryCount + 1), 500);
        }
        return;
    }

    const isMarkerDisplayed = state.displayedOpportunityMarkers.some(m => m.opportunityData.id === opportunityId);

    if (isMarkerDisplayed) {
        setTimeout(() => {
            focusOnOpportunity(opportunity);
        }, 300);
    } else {
        const cityLi = state.dom.cityNavigatorList.querySelector(`li[data-city="${opportunity.city}"]`);
        if (cityLi) {
            cityLi.click();
            setTimeout(() => handleDeepLink(retryCount + 1), 600);
        } else {
             setTimeout(() => handleDeepLink(retryCount + 1), 500);
        }
    }
};


const renderMapAndNav = async () => {
    if (!isCitiesDataLoaded || !isOppsDataLoaded) return;

    const citiesInOpps = [...new Set(state.opportunitiesData.map(op => op?.city).filter(Boolean))];
    
    state.cityListForMarkers = citiesInOpps.map(cityName => {
        const cityData = state.citiesData.find(c => c.name === cityName);
        const firstOpp = state.opportunitiesData.find(op => op.city === cityName && op.coords);
        return {
            name: cityName,
            coords: firstOpp ? [firstOpp.coords.latitude, firstOpp.coords.longitude] : null,
            displayId: cityData ? cityData.displayId : null
        };
    }).filter(c => c.coords && c.displayId !== null);
    
    displayCityNavigator();
    
    const currentCityElement = state.dom.cityNavigatorList.querySelector(`li[data-city="${state.currentCityFilter}"]`) || state.dom.cityNavigatorList.querySelector(`li[data-city="all"]`);
    if(currentCityElement) {
       handleCitySelection({ currentTarget: currentCityElement });
    }

    if (state.dom.infoCard.classList.contains('visible') && !state.isLocationEditMode) {
        const docId = state.dom.infoCardActions.dataset.docId;
        const updatedOpp = state.opportunitiesData.find(op => op.id === docId);
        if (updatedOpp) {
            if (!state.isEditMode) {
                showInfoCard(updatedOpp);
            }
        } else {
            hideInfoCard(true);
        }
    }

    if (state.dom.loadingScreen) {
        state.dom.loadingScreen.classList.add('hidden');
        setTimeout(() => state.dom.loadingScreen?.remove(), 500);
        state.dom.loadingScreen = null;
        handleDeepLink();
    }
};

const loadKnowledgeFiles = async () => {
    const { onSnapshot, query, where } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
    if (!state.auth.currentUser) return;
    
    const q = query(state.knowledgeFilesCollection, where("userId", "==", state.auth.currentUser.uid));
    
    onSnapshot(q, (snapshot) => {
        state.knowledgeFiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderKnowledgeFiles();
    });
};

const renderKnowledgeFiles = () => {
    state.dom.knowledgeFilesContainer.innerHTML = '';
    if (state.knowledgeFiles.length === 0) {
        state.dom.knowledgeFilesContainer.innerHTML = '<p>لم يتم رفع أي ملفات بعد.</p>';
        return;
    }
    
    state.knowledgeFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file-alt"></i>
                <span>${file.name}</span>
            </div>
            <button class="delete-file-btn" data-id="${file.id}" data-path="${file.path}" title="حذف الملف"><i class="fas fa-trash-alt"></i></button>
        `;
        state.dom.knowledgeFilesContainer.appendChild(fileItem);
    });

    document.querySelectorAll('.delete-file-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            handleDeleteFile(btn.dataset.id, btn.dataset.path);
        });
    });
};

const handleDeleteFile = async (fileId, filePath) => {
    const confirmed = await showCustomConfirm("هل أنت متأكد من حذف هذا الملف؟ لا يمكن التراجع عن هذا الإجراء.");
    if (confirmed) {
        const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
        const { ref, deleteObject } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js");

        try {
            // Delete from Firestore
            await deleteDoc(doc(state.db, "knowledge_files", fileId));
            
            // Delete from Storage
            const fileRef = ref(state.storage, filePath);
            await deleteObject(fileRef);

            await showCustomConfirm("تم حذف الملف بنجاح.", "نجاح", true);
        } catch (error) {
            console.error("Error deleting file:", error);
            await showCustomConfirm("فشل حذف الملف. قد يكون تم حذفه بالفعل.", "خطأ", true);
        }
    }
};

const attachUIEventListeners = () => {
    state.dom.addOpportunityBtn.addEventListener('click', async () => { if (await requestAdminAccess('editor')) showOpportunityModal(); });
    state.dom.addDynamicFieldBtn.addEventListener('click', () => handleAddNewField());
    state.dom.statusFilterButtons.forEach(button => button.addEventListener('click', (e) => {
        state.currentStatusFilter = e.currentTarget.getAttribute('data-status');
        state.dom.statusFilterButtons.forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');
        displayFilteredMarkers();
    }));
    state.dom.infoCardCloseBtn.addEventListener('click', () => hideInfoCard(true));
    state.dom.opportunityForm.addEventListener('submit', handleFormSubmit);
    state.dom.editCityNumberForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const cityName = state.dom.editCityNameHidden.value;
        const newDisplayId = parseInt(state.dom.editCityDisplayIdInput.value);

        if (!cityName || !newDisplayId || newDisplayId <= 0) {
            await showCustomConfirm("الرجاء إدخال رقم صحيح أكبر من صفر.", 'خطأ', true); return;
        }
        const isTaken = state.citiesData.some(c => c.name !== cityName && c.displayId === newDisplayId);
        if (isTaken) {
            await showCustomConfirm(`الرقم ${newDisplayId} مستخدم حالياً لمدينة أخرى.`, 'خطأ', true); return;
        }
        
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
        try {
            await updateDoc(doc(state.db, "cities", cityName), { displayId: newDisplayId });
            await logAuditEvent('تعديل ترقيم مدينة', { cityName: cityName, newId: newDisplayId });
            state.dom.editCityNumberModal.classList.remove('visible');
        } catch (error) {
            console.error("Error updating city number:", error);
            await showCustomConfirm("فشل تحديث رقم المدينة.", 'خطأ', true);
        }
    });
    
    state.dom.confirmLocationBtn.addEventListener('click', () => endLocationEdit(true));
    state.dom.cancelLocationBtn.addEventListener('click', () => endLocationEdit(false));
    state.dom.applyCoordsBtn.addEventListener('click', panToCoordsFromInput);
    state.dom.coordsEditorInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') panToCoordsFromInput(); });

    state.dom.infoCardDetailsContainer.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-field-btn');
        if (state.isEditMode && deleteBtn) {
            const fieldKey = deleteBtn.dataset.fieldKey;
            handleDeleteField(fieldKey);
        }
    });
    
    state.dom.adminPanelBtn.addEventListener('click', showAdminPanel);
    state.dom.addUserForm.addEventListener('submit', handleAddUser);
    document.querySelectorAll('#admin-panel-modal .admin-tabs .tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('#admin-panel-modal .admin-tabs .tab-btn, #admin-panel-modal .admin-tab-content').forEach(el => el.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
        });
    });
    
    document.querySelectorAll('#chatbot-settings-modal .admin-tabs .tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('#chatbot-settings-modal .admin-tabs .tab-btn, #chatbot-settings-modal .admin-tab-content').forEach(el => el.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
        });
    });

    state.dom.logDateFilter.addEventListener('change', (e) => loadAuditLog(e.target.value));
    state.dom.clearLogFilterBtn.addEventListener('click', () => {
        state.dom.logDateFilter.value = '';
        loadAuditLog();
    });

    state.dom.chatbotFab.addEventListener('click', () => {
        state.dom.chatbotContainer.classList.toggle('visible');
        state.dom.chatbotCallout.classList.remove('visible');
    });
    state.dom.chatbotCloseBtn.addEventListener('click', () => state.dom.chatbotContainer.classList.remove('visible'));
    state.dom.chatbotForm.addEventListener('submit', handleChatSubmit);

    setTimeout(() => { if (!state.dom.chatbotContainer.classList.contains('visible')) state.dom.chatbotCallout.classList.add('visible'); }, 5000);
    state.dom.closeCalloutBtn.addEventListener('click', () => state.dom.chatbotCallout.classList.remove('visible'));

    state.dom.chatbotSettingsBtn.addEventListener('click', async () => {
        if (await requestAdminAccess('admin')) {
            state.dom.knowledgeBaseInput.value = localStorage.getItem('knowledgeBase') || '';
            state.dom.chatbotSettingsModal.classList.add('visible');
        }
    });
    state.dom.chatbotSettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        localStorage.setItem('knowledgeBase', state.dom.knowledgeBaseInput.value);
        state.dom.chatbotSettingsModal.classList.remove('visible');
        await showCustomConfirm("تم حفظ إعدادات المساعد الذكي بنجاح.", 'نجاح', true);
    });

    state.dom.zoomInBtn.addEventListener('click', () => state.map.zoomIn());
    state.dom.zoomOutBtn.addEventListener('click', () => state.map.zoomOut());
    state.dom.zoomAllBtn.addEventListener('click', () => {
        const allCitiesLi = state.dom.cityNavigatorList.querySelector('li[data-city="all"]');
        if (allCitiesLi) allCitiesLi.click();
    });

    state.dom.fileUploadInput.addEventListener('change', handleFileUpload);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const visibleModal = document.querySelector('.modal-container.visible');
            if (visibleModal) {
                visibleModal.classList.remove('visible');
            } else if (state.dom.infoCard.classList.contains('visible')) {
                hideInfoCard(true);
            } else if (state.dom.chatbotContainer.classList.contains('visible')) {
                state.dom.chatbotContainer.classList.remove('visible');
            }
        }
    });

    if (state.map) {
        state.map.on('click', (e) => { if (e.originalEvent.target.closest('.leaflet-marker-icon') === null && !e.originalEvent.target.closest('.info-card') && !e.originalEvent.target.closest('.location-editor')) hideInfoCard(true); });
        state.map.on('zoomend', handleZoomEnd);
        state.map.on('contextmenu', async (e) => {
            e.originalEvent.preventDefault(); 
            const confirmed = await showCustomConfirm(`هل تريد إضافة فرصة جديدة في هذا الموقع؟`, 'إضافة فرصة', false);
            if (confirmed && await requestAdminAccess('editor')) {
                showOpportunityModal(null, { coords: e.latlng });
            }
        });
    }
};

const initApp = async () => {
    if (!cacheDomElements()) return;
    
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js");
    const { getAuth, onAuthStateChanged, signInAnonymously } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js");
    const { getFirestore, collection } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
    const { getStorage } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js");
    const { getFunctions } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js");

    try {
        const app = initializeApp(firebaseConfig);
        state.db = getFirestore(app);
        state.auth = getAuth(app);
        state.functions = getFunctions(app, 'us-central1');
        state.storage = getStorage(app);
        state.opportunitiesCollection = collection(state.db, 'opportunities');
        state.citiesCollection = collection(state.db, 'cities');
        state.usersCollection = collection(state.db, 'users');
        state.auditLogCollection = collection(state.db, 'audit_log');
        state.knowledgeFilesCollection = collection(state.db, 'knowledge_files');
    } catch (error) { 
        console.error("Firebase initialization failed:", error);
        state.dom.loadingScreen.innerHTML = `<p>فشل تهيئة التطبيق. (${error.message})</p>`;
        return; 
    }

    if (!initializeMap()) return;
    attachUIEventListeners();

    onAuthStateChanged(state.auth, (user) => {
        if (user) {
            state.currentUser = { uid: user.uid }; // Store user info
            console.log("Authentication successful, UID:", user.uid);
            loadInitialDataAndAttachListeners();
            loadKnowledgeFiles();
        } else {
            signInAnonymously(state.auth).catch((error) => {
                console.error("Anonymous sign-in failed:", error);
                state.dom.loadingScreen.innerHTML = `<p>فشل المصادقة. لا يمكن تحميل البيانات.</p>`;
            });
        }
    });

    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
        state.currentUser = JSON.parse(storedUser);
    }
};

const loadInitialDataAndAttachListeners = async () => {
    const { onSnapshot } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
    try {
        state.unsubscribeOpps = onSnapshot(state.opportunitiesCollection, (snapshot) => {
            state.opportunitiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            isOppsDataLoaded = true;
            renderMapAndNav();
        }, (error) => {
            console.error("Error fetching opportunities:", error);
            handleFirestoreError(error);
        });

        state.unsubscribeCities = onSnapshot(state.citiesCollection, (snapshot) => {
            state.citiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            isCitiesDataLoaded = true;
            renderMapAndNav();
        }, (error) => {
            console.error("Error fetching cities:", error);
            handleFirestoreError(error);
        });
    } catch (error) {
        console.error("Error setting up listeners:", error);
        handleFirestoreError(error);
    }
};

const handleFirestoreError = (error) => {
    let userMessage = "فشل تحميل البيانات. الرجاء تحديث الصفحة.";
    if (error.code === 'permission-denied') {
        userMessage = "فشل تحميل البيانات: خطأ في الصلاحيات. يرجى مراجعة قواعد الأمان في Firebase.";
    } else {
        userMessage += `\n(${error.message})`;
    }
    if(state.dom.loadingScreen) {
        state.dom.loadingScreen.innerHTML = `<p>${userMessage}</p>`;
    } else {
        showCustomConfirm(userMessage, "خطأ في قاعدة البيانات", true);
    }
};

// ---===[ 11. نقطة البداية (Entry Point) ]===---
document.addEventListener('DOMContentLoaded', initApp);


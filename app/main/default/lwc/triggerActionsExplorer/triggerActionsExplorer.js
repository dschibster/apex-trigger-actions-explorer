import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import getTriggerSettings from '@salesforce/apex/TriggerActionsExplorerController.getTriggerSettings';
import getTriggerActions from '@salesforce/apex/TriggerActionsExplorerController.getTriggerActions';
import upsertTriggerAction from '@salesforce/apex/TriggerActionsExplorerController.upsertTriggerAction';
import updateTriggerActionsOrder from '@salesforce/apex/TriggerActionsExplorerController.updateTriggerActionsOrder';
import getCurrentUserId from '@salesforce/apex/TriggerActionsExplorerController.getCurrentUserId';

export default class TriggerActionsExplorer extends NavigationMixin(LightningElement) {
    @track triggerSettings = [];
    @track triggerActions = [];
    @track selectedSetting = '';
    @track selectedContext = '';
    @track selectedTiming = '';
    @track selectedSettingDeveloperName = '';
    @track isLoading = false;
    @track isUpdating = false;
    @track updatingSection = null; // Track which section is being updated
    @track error = null;
    
    // Cache for DeveloperName validation
    @track existingDeveloperNames = new Set();
    
    // Modal properties
    @track isModalOpen = false;
    @track selectedAction = {};
    @track modalMode = 'view';
    @track sectionContext = ''; // 'before' or 'after'
    
    // Trigger Setting Modal properties
    @track isSettingModalOpen = false;
    @track selectedSettingData = {};
    @track settingModalMode = 'view';
    
    
    
    // Reactive properties for display - these will be populated with Apex data
    @track beforeActions = [];
    @track afterActions = [];
    @track showSections = true;
    
    // Platform event subscription properties
    subscription = null;
    channelName = '/event/TriggerActionsExplorerCallback__e';
    
    // Test property to see if component loads
    testProperty = 'Component loaded successfully!';

    // Base context options for trigger actions - using DML statements
    baseContextOptions = [
        { label: 'Created', value: 'CREATED' },
        { label: 'Updated', value: 'UPDATED' },
        { label: 'Deleted', value: 'DELETED' },
        { label: 'Restored', value: 'RESTORED' }
    ];

    // Base timing options for Before/After selection
    baseTimingOptions = [
        { label: 'Before', value: 'BEFORE' },
        { label: 'After', value: 'AFTER' },
        { label: 'Before and After', value: 'BOTH' }
    ];

    // Context mapping for actual trigger contexts
    contextMapping = {
        'CREATED': ['BEFORE_INSERT', 'AFTER_INSERT'],
        'UPDATED': ['BEFORE_UPDATE', 'AFTER_UPDATE'],
        'DELETED': ['BEFORE_DELETE', 'AFTER_DELETE'],
        'RESTORED': ['AFTER_UNDELETE']
    };

    // Getter for context options based on selected object
    get contextOptions() {
        // Safety check: ensure triggerSettings is loaded
        if (!this.triggerSettings || this.triggerSettings.length === 0) {
            return this.baseContextOptions;
        }

        if (!this.selectedSetting) {
            return this.baseContextOptions;
        }

        const setting = this.triggerSettings.find(s => s.Id === this.selectedSetting);
        if (!setting) {
            return this.baseContextOptions;
        }

        const objectApiName = setting.Object_API_Name__c;
        
        // For ChangeEvent objects (ending with ChangeEvent or __e), only show Created (After Insert)
        if (objectApiName && (objectApiName.endsWith('ChangeEvent') || objectApiName.endsWith('__e'))) {
            return [{ label: 'Created', value: 'CREATED' }];
        }

        return this.baseContextOptions;
    }

    // Getter for timing options based on selected context and object
    get timingOptions() {
        // For Restored context, only show After (no Before or Before and After)
        if (this.selectedContext === 'RESTORED') {
            return [{ label: 'After', value: 'AFTER' }];
        }

        // For ChangeEvent objects, only show After (no Before or Before and After)
        if (this.selectedSetting && this.triggerSettings && this.triggerSettings.length > 0) {
            const setting = this.triggerSettings.find(s => s.Id === this.selectedSetting);
            if (setting) {
                const objectApiName = setting.Object_API_Name__c;
                if (objectApiName && (objectApiName.endsWith('ChangeEvent') || objectApiName.endsWith('__e'))) {
                    return [{ label: 'After', value: 'AFTER' }];
                }
            }
        }

        return this.baseTimingOptions;
    }

    connectedCallback() {
        // Load data when component connects
        this.loadData();
        this.registerErrorListener();
        this.subscribeToPlatformEvent();
    }

    disconnectedCallback() {
        this.unsubscribeFromPlatformEvent();
    }

    // Save user selections to localStorage (only called before deployment)
    saveUserSelections() {
        const selections = {
            selectedSetting: this.selectedSetting,
            selectedContext: this.selectedContext,
            selectedTiming: this.selectedTiming,
            timestamp: Date.now() // Add timestamp to track when saved
        };
        localStorage.setItem('triggerActionsExplorer_selections', JSON.stringify(selections));
    }

    // Clear saved selections from localStorage
    clearSavedSelections() {
        localStorage.removeItem('triggerActionsExplorer_selections');
    }

    // Build cache of existing DeveloperNames for duplicate validation
    buildDeveloperNameCache() {
        this.existingDeveloperNames.clear();
        this.triggerActions.forEach(action => {
            if (action.DeveloperName) {
                this.existingDeveloperNames.add(action.DeveloperName);
            }
        });
    }

    // Getter to provide DeveloperName cache as array for modal
    get developerNameCache() {
        return Array.from(this.existingDeveloperNames);
    }

    // Add a new DeveloperName to the cache (called after successful creation)
    addDeveloperNameToCache(developerName) {
        if (developerName) {
            this.existingDeveloperNames.add(developerName);
        }
    }

    // Restore user selections from localStorage (only after deployment)
    restoreUserSelections() {
        try {
            const savedSelections = localStorage.getItem('triggerActionsExplorer_selections');
            if (savedSelections) {
                const selections = JSON.parse(savedSelections);
                
                // Only restore if the setting still exists
                if (selections.selectedSetting && this.triggerSettings.find(s => s.Id === selections.selectedSetting)) {
                    this.selectedSetting = selections.selectedSetting;
                    const setting = this.triggerSettings.find(s => s.Id === this.selectedSetting);
                    this.selectedSettingDeveloperName = setting ? setting.DeveloperName : '';
                }
                
                // Only restore if the context is still valid
                if (selections.selectedContext && this.contextOptions.find(c => c.value === selections.selectedContext)) {
                    this.selectedContext = selections.selectedContext;
                }
                
                // Only restore if the timing is still valid
                if (selections.selectedTiming && this.timingOptions.find(t => t.value === selections.selectedTiming)) {
                    this.selectedTiming = selections.selectedTiming;
                }
                
                // Clear the saved selections after restoring them
                this.clearSavedSelections();
            }
        } catch (error) {
            // Failed to restore user selections - continue with defaults
        }
    }

    async loadData() {
        try {
            this.isLoading = true;
            this.error = null;
            
            // Fetch data using async/await with timestamp to force fresh data
            const timestamp = Date.now().toString();
            const [settings, actions] = await Promise.all([
                getTriggerSettings({ timestamp: timestamp }),
                getTriggerActions({ timestamp: timestamp })
            ]);
            
            this.triggerSettings = settings || [];
            this.triggerActions = actions || [];
            
            // Build DeveloperName cache for duplicate validation
            this.buildDeveloperNameCache();
            
            // Restore user selections from localStorage after data is loaded
            this.restoreUserSelections();
            
            // Set default selection if data is available and no selections were restored
            if (this.triggerSettings.length > 0 && !this.selectedSetting) {
                this.selectedSetting = this.triggerSettings[0].Id;
                this.selectedSettingDeveloperName = this.triggerSettings[0].DeveloperName;
                this.selectedContext = this.contextOptions[0].value;
                this.selectedTiming = this.timingOptions[0].value; // Default to "Before" to test hiding
            }
            
            // Always update display actions after loading data
            this.updateDisplayActions();
            
        } catch (error) {
            this.error = error.message || 'Failed to load data';
        } finally {
            this.isLoading = false;
        }
    }


    async handleSettingChange(event) {
        this.selectedSetting = event.detail.value;
        
        // Update the DeveloperName as well
        const setting = this.triggerSettings.find(s => s.Id === this.selectedSetting);
        this.selectedSettingDeveloperName = setting ? setting.DeveloperName : '';
        
        // Auto-select context and timing based on object type
        const objectApiName = setting ? setting.Object_API_Name__c : '';
        
        if (objectApiName && (objectApiName.endsWith('ChangeEvent') || objectApiName.endsWith('__e'))) {
            // For ChangeEvent objects: auto-select Created + After
            this.selectedContext = 'CREATED';
            this.selectedTiming = 'AFTER';
        } else {
            // For regular objects: auto-select Created + Before
            this.selectedContext = 'CREATED';
            this.selectedTiming = 'BEFORE';
        }
        
        // Update display actions if we have both selections
        if (this.selectedContext && this.selectedTiming) {
            this.updateDisplayActions();
        }
    }

    async handleContextChange(event) {
        this.selectedContext = event.detail.value;
        
        // Auto-select timing based on context
        if (this.selectedContext === 'RESTORED') {
            // For Restored context: auto-select After
            this.selectedTiming = 'AFTER';
        } else {
            // For other contexts: auto-select Before
            this.selectedTiming = 'BEFORE';
        }
        
        // Update display actions if we have both selections
        if (this.selectedContext && this.selectedTiming) {
            this.updateDisplayActions();
        }
    }

    async handleTimingChange(event) {
        this.selectedTiming = event.detail.value;
        
        // Only update display if we have both context and timing selected
        if (this.selectedContext && this.selectedTiming) {
            this.updateDisplayActions();
        }
    }


    async handleRefresh() {
        await this.loadData();
    }

    handleEditSetting() {
        if (this.selectedSetting) {
            // Find the current setting data
            const setting = this.triggerSettings.find(s => s.Id === this.selectedSetting);
            if (setting) {
                this.selectedSettingData = setting;
                this.settingModalMode = 'edit';
                this.isSettingModalOpen = true;
            }
        }
    }

    handleAddSetting() {
        this.selectedSettingData = {};
        this.settingModalMode = 'create';
        this.isSettingModalOpen = true;
    }

    updateDisplayActions() {
        // Force complete reset first
        this.beforeActions = [];
        this.afterActions = [];
        
        if (!this.selectedSetting || !this.selectedContext || !this.selectedTiming) {
            return;
        }
        
        const setting = this.triggerSettings.find(s => s.Id === this.selectedSetting);
        if (!setting) {
            return;
        }
        
        // Get context fields to check based on the selected DML context
        const contextFields = this.getContextFields(this.selectedContext);
        
        // Filter actions that have the selected setting in any of the context fields
        // Note: The trigger action fields contain Id references to the trigger settings
        const filteredActions = this.triggerActions.filter(action => 
            contextFields.some(field => action[field] === setting.Id)
        );
        
        // Create new arrays to force reactivity
        const newBeforeActions = [];
        const newAfterActions = [];
        
        filteredActions.forEach(action => {
            // Check if action is configured for before context
            if (this.shouldShowBeforeActions && 
                this.isBeforeContext(this.selectedContext) && 
                (action.Before_Insert__c === setting.Id || 
                 action.Before_Update__c === setting.Id || 
                 action.Before_Delete__c === setting.Id)) {
                
                const actionObj = {
                    Id: action.Id,
                    DeveloperName: action.DeveloperName,
                    Label: action.Label || action.DeveloperName,
                    Name: action.Label || action.DeveloperName,
                    Description__c: action.Description__c || 'No description provided',
                    Order__c: action.Order__c || 0,
                    Apex_Class_Name__c: action.Apex_Class_Name__c || null,
                    Flow_Name__c: action.Flow_Name__c || null,
                    Entry_Criteria__c: action.Entry_Criteria__c || null,
                    Allow_Flow_Recursion__c: action.Allow_Flow_Recursion__c || false,
                    Bypass_Execution__c: action.Bypass_Execution__c || false,
                    Bypass_Permission__c: action.Bypass_Permission__c || null,
                    Required_Permission__c: action.Required_Permission__c || null
                };
                
                newBeforeActions.push(actionObj);
            }
            
            // Check if action is configured for after context
            if (this.shouldShowAfterActions && 
                this.isAfterContext(this.selectedContext) && 
                (action.After_Insert__c === setting.Id || 
                 action.After_Update__c === setting.Id || 
                 action.After_Delete__c === setting.Id ||
                 action.After_Undelete__c === setting.Id)) {
                
                const actionObj = {
                    Id: action.Id,
                    DeveloperName: action.DeveloperName,
                    Label: action.Label || action.DeveloperName,
                    Name: action.Label || action.DeveloperName,
                    Description__c: action.Description__c || 'No description provided',
                    Order__c: action.Order__c || 0,
                    Apex_Class_Name__c: action.Apex_Class_Name__c || null,
                    Flow_Name__c: action.Flow_Name__c || null,
                    Entry_Criteria__c: action.Entry_Criteria__c || null,
                    Allow_Flow_Recursion__c: action.Allow_Flow_Recursion__c || false,
                    Bypass_Execution__c: action.Bypass_Execution__c || false,
                    Bypass_Permission__c: action.Bypass_Permission__c || null,
                    Required_Permission__c: action.Required_Permission__c || null
                };
                
                newAfterActions.push(actionObj);
            }
        });
        
        // Sort actions by order
        newBeforeActions.sort((a, b) => (a.Order__c || 0) - (b.Order__c || 0));
        newAfterActions.sort((a, b) => (a.Order__c || 0) - (b.Order__c || 0));
        
        
        // Assign new arrays to trigger reactivity - ensure we're creating new array instances
        this.beforeActions = [...newBeforeActions];
        this.afterActions = [...newAfterActions];
        
        // Force a re-render by updating the main data array as well
        this.triggerActions = [...this.triggerActions];
    }

    isBeforeContext(context) {
        return ['CREATED', 'UPDATED', 'DELETED'].includes(context);
    }

    isAfterContext(context) {
        return ['CREATED', 'UPDATED', 'DELETED', 'RESTORED'].includes(context);
    }

    get shouldShowBeforeActions() {
        return this.selectedTiming === 'BEFORE' || this.selectedTiming === 'BOTH';
    }

    get shouldShowAfterActions() {
        return this.selectedTiming === 'AFTER' || this.selectedTiming === 'BOTH';
    }

    getContextFields(context) {
        // Map the user-friendly context to the actual field names
        const contextMapping = {
            'CREATED': ['Before_Insert__c', 'After_Insert__c'],
            'UPDATED': ['Before_Update__c', 'After_Update__c'],
            'DELETED': ['Before_Delete__c', 'After_Delete__c'],
            'RESTORED': ['After_Undelete__c']
        };
        return contextMapping[context] || [];
    }

    get debugActionsInfo() {
        return {
            beforeActionsType: typeof this.beforeActions,
            afterActionsType: typeof this.afterActions,
            beforeActionsString: JSON.stringify(this.beforeActions),
            afterActionsString: JSON.stringify(this.afterActions)
        };
    }

    get selectedSettingName() {
        if (!this.selectedSetting) return '';
        const setting = this.triggerSettings.find(s => s.Id === this.selectedSetting);
        return setting ? setting.Object_API_Name__c : '';
    }

    get selectedSettingBadgeLabel() {
        if (!this.selectedSetting) return '';
        const setting = this.triggerSettings.find(s => s.Id === this.selectedSetting);
        if (!setting) return '';
        
        // Bypass_Execution__c = true means the trigger is BYPASSED
        // Bypass_Execution__c = false means the trigger is ACTIVE
        return setting.Bypass_Execution__c ? 'Bypassed' : 'Active';
    }

    get selectedSettingBadgeVariant() {
        if (!this.selectedSetting) return 'inverse';
        const setting = this.triggerSettings.find(s => s.Id === this.selectedSetting);
        if (!setting) return 'inverse';
        
        // Bypass_Execution__c = true means the trigger is BYPASSED (error variant)
        // Bypass_Execution__c = false means the trigger is ACTIVE (success variant)
        return setting.Bypass_Execution__c ? 'error' : 'success';
    }

    get selectedContextLabel() {
        const context = this.contextOptions.find(c => c.value === this.selectedContext);
        return context ? context.label : '';
    }

    get selectedTimingLabel() {
        const timing = this.timingOptions.find(t => t.value === this.selectedTiming);
        return timing ? timing.label : 'Select timing...';
    }

    get triggerSettingsOptions() {
        const options = this.triggerSettings.map(setting => ({
            label: setting.Label || setting.Object_API_Name__c,
            value: setting.Id
        }));
        return options;
    }

    get timingOptionsList() {
        return this.timingOptions;
    }

    get isVowelSObject() {
        if (!this.selectedSetting) return false;
        const setting = this.triggerSettings.find(s => s.Id === this.selectedSetting);
        if (!setting) return false;
        
        const sObjectName = setting.Object_API_Name__c;
        return ['A', 'E', 'I', 'O', 'U'].includes(sObjectName.charAt(0).toUpperCase());
    }

    get articleText() {
        return this.isVowelSObject ? 'an' : 'a';
    }

    handleNewAction() {
        // TODO: Implement new action creation
        console.log('New action clicked');
    }

    handleViewAction(event) {
        const actionId = event.detail.actionId;
        const action = this.findActionById(actionId);
        if (action) {
            this.selectedAction = action;
            this.modalMode = 'view';
            this.isModalOpen = true;
        }
    }

    handleEditAction(event) {
        const actionId = event.detail.actionId;
        const action = this.findActionById(actionId);
        if (action) {
            this.selectedAction = action;
            this.modalMode = 'edit';
            this.isModalOpen = true;
        }
    }


    handleAddAction(event) {
        const sectionTitle = event.detail.sectionTitle;
        
        // Determine section context based on title
        if (sectionTitle === 'Before Actions') {
            this.sectionContext = 'before';
        } else if (sectionTitle === 'After Actions') {
            this.sectionContext = 'after';
        }
        
        // Clear selected action and set mode to create
        this.selectedAction = {};
        this.modalMode = 'create';
        this.isModalOpen = true;
        
        console.log('Add action clicked for section:', sectionTitle, 'Context:', this.sectionContext);
    }

    findActionById(actionId) {
        // Search in both before and after actions
        const allActions = [...this.beforeActions, ...this.afterActions];
        return allActions.find(action => action.Id === actionId);
    }

    handleModalClose() {
        this.isModalOpen = false;
        this.selectedAction = {};
        this.modalMode = 'view';
        this.isUpdating = false; // Reset updating state
    }

    handleModalModeChange(event) {
        this.modalMode = event.detail.mode;
    }

    async handleModalUpdate(event) {
        const { actionId, actionData, mode } = event.detail;
        
        try {
            this.isUpdating = true;
            // Don't clear the main error here - keep it separate from modal errors
            
            // Save current user selections before deployment
            this.saveUserSelections();
            
            // Call the upsert method with the action data
            const jobId = await upsertTriggerAction({ actionData: JSON.stringify(actionData) });
            
            // If this is a creation, add the DeveloperName to cache immediately
            if (mode === 'create' && actionData.DeveloperName) {
                this.addDeveloperNameToCache(actionData.DeveloperName);
            }
            
            // The modal will stay open with loading spinner until the platform event callback
            // handles the deployment completion and refreshes the data
            
        } catch (error) {
            const errorMessage = error.body?.message || error.message || 'Failed to process trigger action';
            
            // Check if this is a pre-deployment error that might still trigger a platform event
            // In that case, we should wait for the platform event instead of showing the error immediately
            if (errorMessage.includes('Error upserting trigger action')) {
                // Keep the loading state and wait for platform event
                // The platform event will handle showing the error message
                
                // Set a timeout to show the error if platform event doesn't arrive within 10 seconds
                setTimeout(() => {
                    if (this.isUpdating) {
                        this.showToast('Error', errorMessage, 'error');
                        this.isUpdating = false;
                    }
                }, 10000);
            } else {
                // For other types of errors (network, etc.), show immediately
                this.showToast('Error', errorMessage, 'error');
                this.isUpdating = false;
            }
        }
    }

    // Trigger Setting Modal handlers
    handleSettingModalClose() {
        this.isSettingModalOpen = false;
        this.selectedSettingData = {};
        this.settingModalMode = 'view';
        this.isUpdating = false; // Reset updating state
    }

    handleSettingModalModeChange(event) {
        this.settingModalMode = event.detail.mode;
    }

    async handleSettingModalUpdate(event) {
        const { settingId, settingData, mode, jobId } = event.detail;
        
        try {
            this.isUpdating = true;
            
            // Save current user selections before deployment
            this.saveUserSelections();
            
            if (mode === 'create') {
                console.log('Creating new setting:', settingData);
            } else {
                console.log('Updating setting:', settingId, settingData);
            }
            
            console.log('Setting deployment initiated, job ID:', jobId);
            
            // Keep modal open and show loading spinner during deployment
            console.log('Deployment initiated, keeping modal open with loading spinner');
            console.log('Waiting for platform event callback...');
            
            // The modal will stay open with loading spinner until the platform event callback
            // handles the deployment completion and refreshes the data
            
        } catch (error) {
            console.error('Error processing trigger setting:', error);
            const errorMessage = error.body?.message || error.message || 'Failed to process trigger setting';
            
            // Check if this is a pre-deployment error that might still trigger a platform event
            // In that case, we should wait for the platform event instead of showing the error immediately
            if (errorMessage.includes('Error upserting trigger setting')) {
                console.log('Pre-deployment error detected, waiting for platform event callback...');
                // Keep the loading state and wait for platform event
                // The platform event will handle showing the error message
                
                // Set a timeout to show the error if platform event doesn't arrive within 10 seconds
                setTimeout(() => {
                    if (this.isUpdating) {
                        this.showToast('Error', errorMessage, 'error');
                        this.isUpdating = false;
                    }
                }, 10000);
            } else {
                // For other types of errors (network, etc.), show immediately
                this.showToast('Error', errorMessage, 'error');
                this.isUpdating = false;
            }
        }
    }

    get hasBeforeActions() {
        return this.beforeActions && this.beforeActions.length > 0;
    }

    get hasAfterActions() {
        return this.afterActions && this.afterActions.length > 0;
    }

    get isEditSettingDisabled() {
        return this.isLoading || !this.selectedSetting;
    }

    get testData() {
        return {
            firstSettingName: this.triggerSettings.length > 0 ? this.triggerSettings[0].DeveloperName : 'None',
            firstActionName: this.triggerActions.length > 0 ? this.triggerActions[0].DeveloperName : 'None',
            firstActionBeforeInsert: this.triggerActions.length > 0 ? this.triggerActions[0].Before_Insert__c : 'None'
        };
    }

    get firstTriggerSettingJson() {
        if (this.triggerSettings.length === 0) return 'No trigger settings found';
        return JSON.stringify(this.triggerSettings[0], null, 2);
    }

    get firstTriggerActionJson() {
        if (this.triggerActions.length === 0) return 'No trigger actions found';
        return JSON.stringify(this.triggerActions[0], null, 2);
    }

    /**
     * Refreshes data with retry mechanism to handle asynchronous metadata deployment
     */
    async refreshDataWithRetry() {
        const maxRetries = 3;
        const retryDelay = 2000; // 2 seconds
        
        // Store the current action data to detect changes
        const originalActionData = JSON.stringify(this.triggerActions);
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Refreshing data (attempt ${attempt}/${maxRetries})`);
                
                // Wait before retrying (except on first attempt)
                if (attempt > 1) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
                
                // Try to load fresh data
                await this.loadData();
                
                // Check if data actually changed
                const currentActionData = JSON.stringify(this.triggerActions);
                console.log('Original data length:', originalActionData.length);
                console.log('Current data length:', currentActionData.length);
                console.log('Data changed:', currentActionData !== originalActionData);
                
                if (currentActionData !== originalActionData || attempt === maxRetries) {
                    console.log('Data refresh successful - data has changed');
                    
                    // Force a re-render by updating a tracked property
                    this.triggerActions = [...this.triggerActions];
                    
                    // Now update display with fresh data (this will force complete reset)
                    this.updateDisplayActions();
                    console.log('Display actions updated. Before actions:', this.beforeActions.length, 'After actions:', this.afterActions.length);
                    return;
                }
                
                console.log('Data not yet updated, will retry...');
                
            } catch (error) {
                console.error(`Data refresh attempt ${attempt} failed:`, error);
                
                if (attempt === maxRetries) {
                    console.error('All data refresh attempts failed');
                    this.showToast('Warning', 'Data refresh failed. Please refresh the page manually.', 'warning');
                }
            }
        }
    }


    /**
     * Forces a complete component refresh by temporarily hiding and showing sections
     */
    forceComponentRefresh() {
        console.log('Forcing component refresh...');
        
        // Temporarily hide the sections
        this.showSections = false;
        
        // Force a re-render by updating arrays with completely new instances
        this.triggerActions = [...this.triggerActions];
        this.beforeActions = [...this.beforeActions];
        this.afterActions = [...this.afterActions];
        
        // Also force update the selected values to trigger reactivity
        const currentSetting = this.selectedSetting;
        const currentContext = this.selectedContext;
        const currentTiming = this.selectedTiming;
        
        // Temporarily clear and reset selections
        this.selectedSetting = '';
        this.selectedContext = '';
        this.selectedTiming = '';
        
        // Use setTimeout to show sections and restore selections after the DOM updates
        setTimeout(() => {
            this.showSections = true;
            this.selectedSetting = currentSetting;
            this.selectedContext = currentContext;
            this.selectedTiming = currentTiming;
            console.log('Component refresh completed with selections restored');
        }, 100);
    }

    /**
     * Shows a toast notification
     * @param {string} title - The title of the toast
     * @param {string} message - The message to display
     * @param {string} variant - The variant (success, error, warning, info)
     */
    showToast(title, message, variant = 'info') {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }

    /**
     * Registers error listener for platform events
     */
    registerErrorListener() {
        onError(error => {
            console.error('Platform event error:', error);
        });
    }

    /**
     * Subscribes to the TriggerActionsExplorerCallback platform event
     */
    async subscribeToPlatformEvent() {
        const messageCallback = async (response) => {
            console.log('Platform event received:', response);
            console.log('Platform event payload:', JSON.stringify(response.data.payload, null, 2));
            
            // Check if this event is for the current user
            const eventData = response.data.payload;
            const currentUserId = await this.getCurrentUserId();    
            console.log('Current user ID:', currentUserId);
            console.log('Event data keys:', Object.keys(eventData));
            console.log('Event data Message__c:', eventData.Message__c);
            
            if (eventData.UserId__c === currentUserId) {
                console.log('Deployment callback received for current user');
                // Handle case where Message__c field might not exist yet
                const message = eventData.Message__c || 'No message available';
                this.handleDeploymentCallback(eventData.Status__c, message);
            } else {
                console.log('Deployment callback received for different user, ignoring');
            }
        };

        // Subscribe to the platform event
        subscribe(this.channelName, -1, messageCallback).then(response => {
            console.log('Successfully subscribed to platform event:', response);
            this.subscription = response;
        }).catch(error => {
            console.error('Error subscribing to platform event:', error);
        });
    }

    /**
     * Unsubscribes from the platform event
     */
    unsubscribeFromPlatformEvent() {
        if (this.subscription) {
            unsubscribe(this.subscription, response => {
                console.log('Successfully unsubscribed from platform event:', response);
            });
            this.subscription = null;
        }
    }

    /**
     * Gets the current user ID from Apex
     */
    async getCurrentUserId() {
        try {
            const userId = await getCurrentUserId();
            return userId;
        } catch (error) {
            console.error('Error getting current user ID:', error);
            return null;
        }
    }

    /**
     * Handles deployment callback from platform event
     * @param {string} status - The deployment status (succeeded, failed)
     * @param {string} message - The deployment message
     */
    async handleDeploymentCallback(status, message) {
        console.log('Handling deployment callback with status:', status, 'message:', message);
        
        if (status === 'succeeded') {
            console.log('Deployment succeeded, refreshing data from platform event...');
            
            try {
                // Store original data for comparison
                const originalActionData = JSON.stringify(this.triggerActions);
                const originalSettingData = JSON.stringify(this.triggerSettings);
                console.log('Original action data before platform event refresh:', originalActionData);
                console.log('Original setting data before platform event refresh:', originalSettingData);
                
                // Use fresh query (bypasses caching) without additional delays
                console.log('Loading fresh data after platform event...');
                await this.loadData();
                
                // Check if data actually changed
                const newActionData = JSON.stringify(this.triggerActions);
                const newSettingData = JSON.stringify(this.triggerSettings);
                console.log('New action data after platform event refresh:', newActionData);
                console.log('New setting data after platform event refresh:', newSettingData);
                const actionDataChanged = originalActionData !== newActionData;
                const settingDataChanged = originalSettingData !== newSettingData;
                console.log('Action data changed:', actionDataChanged);
                console.log('Setting data changed:', settingDataChanged);
                
                // Log specific order values to see what's happening
                console.log('Order values in loaded data:');
                this.triggerActions.forEach((action, index) => {
                    console.log(`  ${action.DeveloperName}: Order = ${action.Order__c}`);
                });
                
                // Log specific order values for debugging
                console.log('All trigger actions after platform event refresh:');
                this.triggerActions.forEach((action, index) => {
                    console.log(`Action ${index}: ${action.DeveloperName}, Order: ${action.Order__c}`);
                });
                
                // Force complete reset and refresh
                this.beforeActions = [];
                this.afterActions = [];
                console.log('Display arrays reset');
                
                // Update display with fresh data
                this.updateDisplayActions();
                console.log('Display actions updated');
                
                // Log the display arrays after update
                console.log('Before actions after update:', this.beforeActions.length);
                console.log('=== BEFORE LIST ORDER ===');
                this.beforeActions.forEach((action, index) => {
                    console.log(`Before action ${index}: ${action.DeveloperName}, Order: ${action.Order__c}`);
                });
                console.log('=== END BEFORE LIST ORDER ===');
                console.log('After actions after update:', this.afterActions.length);
                this.afterActions.forEach((action, index) => {
                    console.log(`After action ${index}: ${action.DeveloperName}, Order: ${action.Order__c}`);
                });
                
                // Force a re-render by updating the main data array
                this.triggerActions = [...this.triggerActions];
                console.log('Main data array updated for reactivity');
                
                // Force component refresh to handle Proxy object issues
                this.forceComponentRefresh();
                console.log('Component refresh completed');
                
                // Log the order again after component refresh
                console.log('=== BEFORE LIST ORDER AFTER COMPONENT REFRESH ===');
                this.beforeActions.forEach((action, index) => {
                    console.log(`Before action ${index}: ${action.DeveloperName}, Order: ${action.Order__c}`);
                });
                console.log('=== END BEFORE LIST ORDER AFTER COMPONENT REFRESH ===');
                
                // Also log after a delay to see if the order changes
                setTimeout(() => {
                    console.log('=== BEFORE LIST ORDER AFTER DELAY ===');
                    this.beforeActions.forEach((action, index) => {
                        console.log(`Before action ${index}: ${action.DeveloperName}, Order: ${action.Order__c}`);
                    });
                    console.log('=== END BEFORE LIST ORDER AFTER DELAY ===');
                }, 200);
                
                console.log('Data refreshed successfully after platform event');
                
                // Close modals and show success message
                const successMessage = message || 'Deployment completed successfully';
                if (settingDataChanged) {
                    console.log('Setting data was updated, showing success message');
                }
                if (actionDataChanged) {
                    console.log('Action data was updated, showing success message');
                }
                this.showToast('Success', successMessage, 'success');
                this.handleModalClose();
                this.handleSettingModalClose();
                
            } catch (error) {
                console.error('Error refreshing data after platform event:', error);
                this.showToast('Warning', 'Data refresh failed. Please refresh the page manually.', 'warning');
            }
            
        } else if (status === 'failed') {
            console.error('Deployment failed:', message);
            this.showToast('Error', message || 'Deployment failed. Please try again.', 'error');
        }
        
        // Reset updating state
        this.isUpdating = false;
        this.updatingSection = null;
    }

    // Handle entering edit mode - exit other sections
    handleEnterEditMode(event) {
        const { sectionTitle } = event.detail;
        console.log('Entering edit mode for section:', sectionTitle);
        
        // Get all section components and exit edit mode for others
        const sectionComponents = this.template.querySelectorAll('c-trigger-actions-section');
        sectionComponents.forEach(section => {
            if (section.title !== sectionTitle) {
                section.exitEditMode();
            }
        });
    }

    // Handle saving order changes
    async handleSaveOrder(event) {
        const { sectionTitle, updatedActions } = event.detail;
        console.log('Saving order for section:', sectionTitle, 'Updated actions:', updatedActions);
        
        try {
            this.isUpdating = true;
            this.updatingSection = sectionTitle; // Track which section is being updated
            
            // Save current user selections before deployment
            this.saveUserSelections();
            
            // Prepare actions data for mass update - preserve the Order__c values from the section
            const actionsToUpdate = updatedActions.map((action) => ({
                DeveloperName: action.DeveloperName,
                Label: action.Label || action.DeveloperName,
                Order__c: action.Order__c // Use the Order__c value as determined by the section (manual or enumerated)
            }));
            
            console.log('Prepared actions for mass update preserving order values:');
            actionsToUpdate.forEach((action, index) => {
                console.log(`  ${index + 1}. ${action.DeveloperName} -> Order: ${action.Order__c} (type: ${typeof action.Order__c})`);
            });
            
            // Call the mass update Apex method
            const jobId = await updateTriggerActionsOrder({ actionsData: JSON.stringify(actionsToUpdate) });
            
            console.log('Mass update deployment initiated, job ID:', jobId);
            
            // Update local arrays immediately for better UX
            if (sectionTitle === 'Before Actions') {
                this.beforeActions = updatedActions;
            } else if (sectionTitle === 'After Actions') {
                this.afterActions = updatedActions;
            }
            
            // Force reactivity update
            this.beforeActions = [...this.beforeActions];
            this.afterActions = [...this.afterActions];
            
            console.log('Order update initiated successfully');
            this.showToast('Success', 'Order update initiated. Changes will be applied shortly.', 'success');
            
            // Don't reset isUpdating here - let the deployment callback handle it
            // The spinner will continue until the platform event callback completes
            
        } catch (error) {
            console.error('Error updating order:', error);
            this.showToast('Error', 'Failed to update order: ' + (error.body?.message || error.message), 'error');
            this.isUpdating = false; // Reset on error
            this.updatingSection = null; // Reset updating section on error
        }
    }

}

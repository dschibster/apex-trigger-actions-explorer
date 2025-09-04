import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import getTriggerSettings from '@salesforce/apex/TriggerActionsExplorerController.getTriggerSettings';
import getTriggerActions from '@salesforce/apex/TriggerActionsExplorerController.getTriggerActions';
import getTriggerActionsFresh from '@salesforce/apex/TriggerActionsExplorerController.getTriggerActionsFresh';
import upsertTriggerAction from '@salesforce/apex/TriggerActionsExplorerController.upsertTriggerAction';
import getCurrentUserId from '@salesforce/apex/TriggerActionsExplorerController.getCurrentUserId';

export default class TriggerActionsExplorer extends NavigationMixin(LightningElement) {
    @track triggerSettings = [];
    @track triggerActions = [];
    @track selectedSetting = '';
    @track selectedContext = '';
    @track selectedTiming = '';
    @track isLoading = false;
    @track isUpdating = false;
    @track error = null;
    
    // Modal properties
    @track isModalOpen = false;
    @track selectedAction = {};
    @track modalMode = 'view';
    
    // Reactive properties for display - these will be populated with Apex data
    @track beforeActions = [];
    @track afterActions = [];
    @track showSections = true;
    
    // Platform event subscription properties
    subscription = null;
    channelName = '/event/TriggerActionsExplorerCallback__e';
    
    // Test property to see if component loads
    testProperty = 'Component loaded successfully!';

    // Context options for trigger actions - using DML statements
    contextOptions = [
        { label: 'Created', value: 'CREATED' },
        { label: 'Updated', value: 'UPDATED' },
        { label: 'Deleted', value: 'DELETED' },
        { label: 'Restored', value: 'RESTORED' }
    ];

    // Timing options for Before/After selection
    timingOptions = [
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

    connectedCallback() {
        // Load data when component connects
        this.loadData();
        this.registerErrorListener();
        this.subscribeToPlatformEvent();
    }

    disconnectedCallback() {
        this.unsubscribeFromPlatformEvent();
    }

    async loadData() {
        try {
            this.isLoading = true;
            this.error = null;
            
            // Fetch data using async/await
            const [settings, actions] = await Promise.all([
                getTriggerSettings(),
                getTriggerActions()
            ]);
            
            this.triggerSettings = settings || [];
            this.triggerActions = actions || [];
            
            console.log('Data loaded - Trigger Actions count:', this.triggerActions.length);
            console.log('All trigger actions with order:');
            this.triggerActions.forEach((action, index) => {
                console.log(`  ${index}: ${action.DeveloperName} - Order: ${action.Order__c}`);
            });
            console.log('First action data:', this.triggerActions[0] ? JSON.stringify(this.triggerActions[0], null, 2) : 'No actions');
            
            // Set default selection if data is available
            if (this.triggerSettings.length > 0) {
                this.selectedSetting = this.triggerSettings[0].Id;
                this.selectedContext = this.contextOptions[0].value;
                this.selectedTiming = this.timingOptions[2].value; // Default to "Before and After"
            }
            
            // Always update display actions after loading data
            this.updateDisplayActions();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.error = error.message || 'Failed to load data';
        } finally {
            this.isLoading = false;
        }
    }

    async loadDataFresh() {
        try {
            console.log('Loading fresh data (bypassing cache)...');
            
            const [settings, actions] = await Promise.all([
                getTriggerSettings(),
                getTriggerActionsFresh() // Use fresh query that bypasses caching
            ]);
            
            this.triggerSettings = settings || [];
            this.triggerActions = actions || [];
            
            console.log('Fresh data loaded - Trigger Actions count:', this.triggerActions.length);
            console.log('All trigger actions with order (fresh):');
            this.triggerActions.forEach((action, index) => {
                console.log(`  ${index}: ${action.DeveloperName} - Order: ${action.Order__c}`);
            });
            
            // Always update display actions after loading data
            this.updateDisplayActions();
            
        } catch (error) {
            console.error('Error loading fresh data:', error);
            throw error;
        }
    }

    async handleSettingChange(event) {
        this.selectedSetting = event.detail.value;
        this.updateDisplayActions();
    }

    async handleContextChange(event) {
        this.selectedContext = event.detail.value;
        this.updateDisplayActions();
    }

    async handleTimingChange(event) {
        this.selectedTiming = event.detail.value;
        this.updateDisplayActions();
    }

    updateDisplayActions() {
        console.log('updateDisplayActions called');
        console.log('Selected setting:', this.selectedSetting);
        console.log('Selected context:', this.selectedContext);
        console.log('Selected timing:', this.selectedTiming);
        console.log('Trigger actions count:', this.triggerActions.length);
        
        // Force complete reset first
        this.beforeActions = [];
        this.afterActions = [];
        
        if (!this.selectedSetting || !this.selectedContext || !this.selectedTiming) {
            console.log('Missing selections, returning early');
            return;
        }
        
        const setting = this.triggerSettings.find(s => s.Id === this.selectedSetting);
        if (!setting) {
            console.log('Setting not found, returning early');
            return;
        }
        
        console.log('Found setting:', setting.Object_API_Name__c);
        
        // Get context fields to check based on the selected DML context
        const contextFields = this.getContextFields(this.selectedContext);
        console.log('Context fields:', contextFields);
        
        // Filter actions that have the selected setting in any of the context fields
        const filteredActions = this.triggerActions.filter(action => 
            contextFields.some(field => action[field] === setting.Id)
        );
        
        console.log('Filtered actions count:', filteredActions.length);
        
        // Create new arrays to force reactivity
        const newBeforeActions = [];
        const newAfterActions = [];
        
        filteredActions.forEach(action => {
            // Check if action is configured for before context
            if (this.shouldShowBeforeActions() && 
                this.isBeforeContext(this.selectedContext) && 
                (action.Before_Insert__c === setting.Id || 
                 action.Before_Update__c === setting.Id || 
                 action.Before_Delete__c === setting.Id)) {
                
                const actionObj = {
                    Id: action.Id,
                    Name: action.DeveloperName,
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
            if (this.shouldShowAfterActions() && 
                this.isAfterContext(this.selectedContext) && 
                (action.After_Insert__c === setting.Id || 
                 action.After_Update__c === setting.Id || 
                 action.After_Delete__c === setting.Id ||
                 action.After_Undelete__c === setting.Id)) {
                
                const actionObj = {
                    Id: action.Id,
                    Name: action.DeveloperName,
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
        
        console.log('After sorting:');
        console.log('New before actions order:', newBeforeActions.map(a => `${a.DeveloperName}:${a.Order__c}`));
        console.log('New after actions order:', newAfterActions.map(a => `${a.DeveloperName}:${a.Order__c}`));
        
        // Assign new arrays to trigger reactivity - ensure we're creating new array instances
        this.beforeActions = [...newBeforeActions];
        this.afterActions = [...newAfterActions];
        
        console.log('Display actions updated:');
        console.log('Before actions:', this.beforeActions.length);
        console.log('After actions:', this.afterActions.length);
        console.log('Before actions data:', this.beforeActions);
        console.log('After actions data:', this.afterActions);
        
        // Force a re-render by updating the main data array as well
        this.triggerActions = [...this.triggerActions];
    }

    isBeforeContext(context) {
        return ['CREATED', 'UPDATED', 'DELETED'].includes(context);
    }

    isAfterContext(context) {
        return ['CREATED', 'UPDATED', 'DELETED', 'RESTORED'].includes(context);
    }

    shouldShowBeforeActions() {
        return this.selectedTiming === 'BEFORE' || this.selectedTiming === 'BOTH';
    }

    shouldShowAfterActions() {
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

    get selectedContextLabel() {
        const context = this.contextOptions.find(c => c.value === this.selectedContext);
        return context ? context.label : '';
    }

    get triggerSettingsOptions() {
        const options = this.triggerSettings.map(setting => ({
            label: setting.Object_API_Name__c,
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

    handleDeleteAction(event) {
        const actionId = event.detail.actionId;
        // TODO: Implement action deletion
        console.log('Delete action:', actionId);
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
        const { actionId, actionData } = event.detail;
        
        try {
            this.isUpdating = true;
            // Don't clear the main error here - keep it separate from modal errors
            
            console.log('Updating action:', actionId, actionData);
            
            // Call the upsert method with the action data
            const jobId = await upsertTriggerAction({ actionData: JSON.stringify(actionData) });
            
            console.log('Update initiated, deployment job ID:', jobId);
            
            // Keep modal open and show loading spinner during deployment
            console.log('Deployment initiated, keeping modal open with loading spinner');
            console.log('Waiting for platform event callback...');
            
            // The modal will stay open with loading spinner until the platform event callback
            // handles the deployment completion and refreshes the data
            
        } catch (error) {
            console.error('Error updating trigger action:', error);
            const errorMessage = error.body?.message || error.message || 'Failed to update trigger action';
            this.showToast('Error', errorMessage, 'error');
            // Don't set this.error as it affects the entire view
            // The modal will remain open for the user to retry
            
            // Reset updating state after error
            this.isUpdating = false;
        }
    }

    get hasBeforeActions() {
        return this.beforeActions && this.beforeActions.length > 0;
    }

    get hasAfterActions() {
        return this.afterActions && this.afterActions.length > 0;
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
            
            // Check if this event is for the current user
            const eventData = response.data.payload;
            const currentUserId = await this.getCurrentUserId();    
            console.log('Current user ID:', currentUserId);
            
            if (eventData.UserId__c === currentUserId) {
                console.log('Deployment callback received for current user');
                this.handleDeploymentCallback(eventData.Status__c);
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
     */
    async handleDeploymentCallback(status) {
        console.log('Handling deployment callback with status:', status);
        
        if (status === 'succeeded') {
            console.log('Deployment succeeded, refreshing data from platform event...');
            
            try {
                // Store original data for comparison
                const originalData = JSON.stringify(this.triggerActions);
                console.log('Original data before platform event refresh:', originalData);
                
                // Implement retry mechanism to wait for data to actually change
                const maxRetries = 10;
                const retryDelay = 2000; // 2 seconds between retries
                let dataChanged = false;
                
                // Start with a longer initial delay since platform event might fire too early
                console.log('Waiting 3 seconds for metadata to be fully committed...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    console.log(`Platform event data refresh attempt ${attempt}/${maxRetries}`);
                    
                    // Wait before retrying (except on first attempt)
                    if (attempt > 1) {
                        console.log(`Waiting ${retryDelay}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                    }
                    
                    // Refresh the data using fresh query (bypasses caching)
                    console.log('Loading fresh data after platform event...');
                    await this.loadDataFresh();
                    
                    // Check if data actually changed
                    const newData = JSON.stringify(this.triggerActions);
                    console.log('New data after platform event refresh:', newData);
                    dataChanged = originalData !== newData;
                    console.log('Data changed:', dataChanged);
                    
                    // Also log specific order values to see what's happening
                    console.log('Order values in loaded data:');
                    this.triggerActions.forEach((action, index) => {
                        console.log(`  ${action.DeveloperName}: Order = ${action.Order__c}`);
                    });
                    
                    if (dataChanged) {
                        console.log('Data has changed! Proceeding with display update...');
                        break;
                    } else {
                        console.log('Data not yet changed, will retry...');
                        if (attempt === maxRetries) {
                            console.log('Max retries reached, proceeding anyway...');
                        }
                    }
                }
                
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
                
                // Close modal and show success message
                this.showToast('Success', 'Trigger Action updated successfully', 'success');
                this.handleModalClose();
                
            } catch (error) {
                console.error('Error refreshing data after platform event:', error);
                this.showToast('Warning', 'Data refresh failed. Please refresh the page manually.', 'warning');
            }
            
        } else if (status === 'failed') {
            console.error('Deployment failed');
            this.showToast('Error', 'Deployment failed. Please try again.', 'error');
        }
        
        // Reset updating state
        this.isUpdating = false;
    }
}

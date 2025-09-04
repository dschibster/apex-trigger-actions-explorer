import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getTriggerSettings from '@salesforce/apex/TriggerActionsExplorerController.getTriggerSettings';
import getTriggerActions from '@salesforce/apex/TriggerActionsExplorerController.getTriggerActions';
import upsertTriggerAction from '@salesforce/apex/TriggerActionsExplorerController.upsertTriggerAction';

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
            
            // Set default selection if data is available
            if (this.triggerSettings.length > 0) {
                this.selectedSetting = this.triggerSettings[0].Id;
                this.selectedContext = this.contextOptions[0].value;
                this.selectedTiming = this.timingOptions[2].value; // Default to "Before and After"
                
                // Update display actions based on initial selection
                this.updateDisplayActions();
            }
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.error = error.message || 'Failed to load data';
        } finally {
            this.isLoading = false;
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
        if (!this.selectedSetting || !this.selectedContext || !this.selectedTiming) {
            this.beforeActions = [];
            this.afterActions = [];
            return;
        }
        
        const setting = this.triggerSettings.find(s => s.Id === this.selectedSetting);
        if (!setting) {
            this.beforeActions = [];
            this.afterActions = [];
            return;
        }
        
        // Get context fields to check based on the selected DML context
        const contextFields = this.getContextFields(this.selectedContext);
        
        // Filter actions that have the selected setting in any of the context fields
        const filteredActions = this.triggerActions.filter(action => 
            contextFields.some(field => action[field] === setting.Id)
        );
        
        // Separate actions into before and after based on context
        this.beforeActions = [];
        this.afterActions = [];
        
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
                
                this.beforeActions.push(actionObj);
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
                
                this.afterActions.push(actionObj);
            }
        });
        
        // Sort actions by order
        this.beforeActions.sort((a, b) => (a.Order__c || 0) - (b.Order__c || 0));
        this.afterActions.sort((a, b) => (a.Order__c || 0) - (b.Order__c || 0));
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
            
            // Since we can't reliably poll deployment status with enqueueDeployment(),
            // we'll provide immediate feedback and let the callback handle the actual result
            this.showToast('Success', 'Trigger Action update initiated successfully', 'success');
            this.handleModalClose();
            await this.loadData(); // Refresh data
            
        } catch (error) {
            console.error('Error updating trigger action:', error);
            const errorMessage = error.body?.message || error.message || 'Failed to update trigger action';
            this.showToast('Error', errorMessage, 'error');
            // Don't set this.error as it affects the entire view
            // The modal will remain open for the user to retry
        } finally {
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
}

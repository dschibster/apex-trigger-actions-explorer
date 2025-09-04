import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getTriggerSettings from '@salesforce/apex/TriggerActionsExplorerController.getTriggerSettings';
import getTriggerActions from '@salesforce/apex/TriggerActionsExplorerController.getTriggerActions';

export default class TriggerActionsExplorer extends NavigationMixin(LightningElement) {
    @track triggerSettings = [];
    @track triggerActions = [];
    @track selectedSetting = '';
    @track selectedContext = '';
    @track selectedTiming = '';
    @track isLoading = false;
    @track error = null;
    
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
            
            console.log('Loading data from Apex...');
            
            // Fetch data using async/await
            const [settings, actions] = await Promise.all([
                getTriggerSettings(),
                getTriggerActions()
            ]);
            
            this.triggerSettings = settings || [];
            this.triggerActions = actions || [];
            
            console.log('Data loaded successfully:', {
                triggerSettings: this.triggerSettings.length,
                triggerActions: this.triggerActions.length
            });
            
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
        console.log('=== Setting Change Handler START ===');
        console.log('Event received:', event);
        console.log('Event detail:', event.detail);
        
        this.selectedSetting = event.detail.value;
        console.log('Selected setting updated to:', this.selectedSetting);
        
        // Update display actions based on new selection
        this.updateDisplayActions();
        
        console.log('=== Setting Change Handler END ===');
    }

    async handleContextChange(event) {
        console.log('=== Context Change ===');
        console.log('Event detail:', event.detail);
        this.selectedContext = event.detail.value;
        console.log('Selected context updated to:', this.selectedContext);
        
        // Update display actions based on new selection
        this.updateDisplayActions();
    }

    async handleTimingChange(event) {
        console.log('=== Timing Change ===');
        console.log('Event detail:', event.detail);
        this.selectedTiming = event.detail.value;
        console.log('Selected timing updated to:', this.selectedTiming);
        
        // Update display actions based on new selection
        this.updateDisplayActions();
    }

    updateDisplayActions() {
        console.log('=== updateDisplayActions called ===');
        console.log('Current state:', {
            selectedSetting: this.selectedSetting,
            selectedContext: this.selectedContext,
            triggerSettingsCount: this.triggerSettings.length,
            triggerActionsCount: this.triggerActions.length
        });
        
        if (!this.selectedSetting || !this.selectedContext || !this.selectedTiming) {
            console.log('No selection, clearing actions');
            this.beforeActions = [];
            this.afterActions = [];
            return;
        }
        
        const setting = this.triggerSettings.find(s => s.Id === this.selectedSetting);
        if (!setting) {
            console.log('Setting not found, clearing actions');
            this.beforeActions = [];
            this.afterActions = [];
            return;
        }
        
        console.log('Processing actions for setting:', {
            id: setting.Id,
            developerName: setting.DeveloperName,
            objectApiName: setting.Object_API_Name__c
        });
        
        // Get context fields to check based on the selected DML context
        const contextFields = this.getContextFields(this.selectedContext);
        console.log('Context fields for', this.selectedContext, ':', contextFields);
        
        // Debug: Check what actions exist and their context field values
        console.log('All trigger actions:', this.triggerActions.map(a => ({
            id: a.Id,
            name: a.DeveloperName,
            beforeInsert: a.Before_Insert__c,
            afterInsert: a.After_Insert__c,
            beforeUpdate: a.Before_Update__c,
            afterUpdate: a.After_Update__c,
            beforeDelete: a.Before_Delete__c,
            afterDelete: a.After_Delete__c,
            afterUndelete: a.After_Undelete__c
        })));
        
        // Filter actions that have the selected setting in any of the context fields
        const filteredActions = this.triggerActions.filter(action => 
            contextFields.some(field => action[field] === setting.Id)
        );
        
        console.log('Filtered actions count:', filteredActions.length);
        console.log('Sample filtered action:', filteredActions[0]);
        
        // Separate actions into before and after based on context
        this.beforeActions = [];
        this.afterActions = [];
        
        filteredActions.forEach(action => {
            console.log('Processing action:', {
                id: action.Id,
                developerName: action.DeveloperName,
                description: action.Description__c,
                order: action.Order__c,
                beforeInsert: action.Before_Insert__c,
                afterInsert: action.After_Insert__c,
                beforeUpdate: action.Before_Update__c,
                afterUpdate: action.After_Update__c,
                beforeDelete: action.Before_Delete__c,
                afterDelete: action.After_Delete__c,
                afterUndelete: action.After_Undelete__c
            });
            
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
                
                console.log('Adding to beforeActions:', actionObj);
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
                
                console.log('Adding to afterActions:', actionObj);
                this.afterActions.push(actionObj);
            }
        });
        
        // Sort actions by order
        this.beforeActions.sort((a, b) => (a.Order__c || 0) - (b.Order__c || 0));
        this.afterActions.sort((a, b) => (a.Order__c || 0) - (b.Order__c || 0));
        
        console.log('Final display actions:', {
            beforeActions: this.beforeActions,
            afterActions: this.afterActions,
            beforeCount: this.beforeActions.length,
            afterCount: this.afterActions.length
        });
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
        // TODO: Implement action viewing
        console.log('View action:', actionId);
    }

    handleEditAction(event) {
        const actionId = event.detail.actionId;
        // TODO: Implement action editing
        console.log('Edit action:', actionId);
    }

    handleDeleteAction(event) {
        const actionId = event.detail.actionId;
        // TODO: Implement action deletion
        console.log('Delete action:', actionId);
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
}

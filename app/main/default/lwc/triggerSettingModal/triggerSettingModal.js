import { LightningElement, api, track } from 'lwc';
import upsertTriggerSetting from '@salesforce/apex/TriggerActionsExplorerController.upsertTriggerSetting';

export default class TriggerSettingModal extends LightningElement {
    @api isOpen = false;
    @api setting = {};
    @api mode = 'view'; // 'view', 'edit', or 'create'
    @api isUpdating = false;
    
    @track settingData = {};
    @track originalData = {};
    @track modalError = null;
    @track _currentSettingId = null;
    @track _isCreateDataInitialized = false;

    connectedCallback() {
        this.initializeData();
    }

    renderedCallback() {
        // Only initialize data when modal opens and data is not already initialized
        // Don't re-initialize if we're in create mode and data has already been initialized
        if (this.isOpen && (!this.settingData || Object.keys(this.settingData).length === 0) && 
            !(this.mode === 'create' && this._isCreateDataInitialized)) {
            this.initializeData();
        }
    }

    initializeData() {
        if (this.mode === 'create') {
            // Initialize with empty data for creation
            this.settingData = {
                DeveloperName: '',
                Label: '',
                Object_API_Name__c: '',
                Object_Namespace__c: '',
                TriggerRecord_Class_Name__c: '',
                Required_Permission__c: '',
                Bypass_Permission__c: '',
                Bypass_Execution__c: false
            };
            
            this.originalData = JSON.parse(JSON.stringify(this.settingData));
            this._isCreateDataInitialized = true;
        } else if (this.setting && Object.keys(this.setting).length > 0) {
            // Create a deep copy of the setting data
            this.settingData = JSON.parse(JSON.stringify(this.setting));
            this.originalData = JSON.parse(JSON.stringify(this.setting));
            this._isCreateDataInitialized = false;
        } else {
            // Clear data if no setting
            this.settingData = {};
            this.originalData = {};
            this._isCreateDataInitialized = false;
        }
    }

    // Watch for changes to the setting property
    get setting() {
        return this._setting;
    }

    set setting(value) {
        // Only update if the setting ID actually changed
        const newSettingId = value?.Id || null;
        if (this._currentSettingId !== newSettingId) {
            this._setting = value;
            this._currentSettingId = newSettingId;
            // Re-initialize data when setting changes
            this.initializeData();
        }
    }

    get modalTitle() {
        if (this.mode === 'create') {
            return 'Create SObject Trigger Setting';
        } else if (this.mode === 'edit') {
            return 'Edit SObject Trigger Setting';
        } else {
            return 'SObject Trigger Setting Details';
        }
    }

    get isReadOnly() {
        return this.mode === 'view';
    }

    get isCreateMode() {
        return this.mode === 'create';
    }

    get buttonLabel() {
        return this.mode === 'create' ? 'Create' : 'Update';
    }

    get isObjectApiNameRequired() {
        return this.mode === 'create' || this.mode === 'edit';
    }

    handleFieldChange(event) {
        const field = event.target.dataset.field;
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        
        this.settingData = {
            ...this.settingData,
            [field]: value
        };
    }

    handleEdit() {
        this.mode = 'edit';
        this.dispatchEvent(new CustomEvent('modechange', {
            detail: { mode: 'edit' }
        }));
    }

    async handleUpdate() {
        // Clear any previous errors
        this.modalError = null;
        
        // Validate required fields for creation and updates
        if (this.mode === 'create') {
            if (!this.settingData.DeveloperName?.trim() || !this.settingData.Label?.trim() || !this.settingData.Object_API_Name__c?.trim()) {
                this.modalError = 'Developer Name, Label, and Object API Name are required fields.';
                return;
            }
        } else if (this.mode === 'edit') {
            // For updates, only validate Object API Name as required
            if (!this.settingData.Object_API_Name__c?.trim()) {
                this.modalError = 'Object API Name is required.';
                return;
            }
        }
        
        try {
            this.isUpdating = true;
            
            if (this.mode === 'create') {
                console.log('Creating new setting:', this.settingData);
            } else {
                console.log('Updating setting:', this.setting.Id, this.settingData);
            }
            
            // Debug: Log the data being sent
            const jsonData = JSON.stringify(this.settingData);
            console.log('Sending JSON data to Apex:', jsonData);
            console.log('Setting data object:', this.settingData);
            console.log('Bypass_Execution__c value:', this.settingData.Bypass_Execution__c, 'type:', typeof this.settingData.Bypass_Execution__c);
            
            // Call the Apex upsert method
            const jobId = await upsertTriggerSetting({ settingDataJson: jsonData });
            
            console.log('Setting deployment initiated, job ID:', jobId);
            
            // Dispatch update event to parent component for platform event handling
            this.dispatchEvent(new CustomEvent('update', {
                detail: { 
                    settingId: this.mode === 'create' ? null : this.setting.Id,
                    settingData: this.settingData,
                    mode: this.mode,
                    jobId: jobId
                }
            }));
            
        } catch (error) {
            console.error('Error processing trigger setting:', error);
            const errorMessage = error.body?.message || error.message || 'Failed to process trigger setting';
            this.modalError = errorMessage;
            this.isUpdating = false;
        }
    }

    handleClose() {
        // Clear any errors when closing
        this.modalError = null;
        // Reset mode to view
        this.mode = 'view';
        // Reset create data initialization flag
        this._isCreateDataInitialized = false;
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleCancel() {
        // Clear any errors when canceling
        this.modalError = null;
        // Restore original data
        this.settingData = JSON.parse(JSON.stringify(this.originalData));
        // Reset create data initialization flag
        this._isCreateDataInitialized = false;
        
        // For both create and edit modes, cancel should close the modal entirely
        this.dispatchEvent(new CustomEvent('close'));
    }
}
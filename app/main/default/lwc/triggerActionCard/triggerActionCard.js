import { LightningElement, api } from 'lwc';

export default class TriggerActionCard extends LightningElement {
    @api action;
    @api isEditOrderMode = false;
    @api isFirstItem = false;
    @api isLastItem = false;
    @api visualOrder = null; // Visual position in the list (1, 2, 3...)

    connectedCallback() {
        // Component connected
    }

    get iconName() {
        return this.action?.Flow_Name__c ? 'utility:flow' : 'utility:apex';
    }

    get displayName() {
        // Use the Name field which contains the MasterLabel
        return this.action?.Name || 'Unnamed Action';
    }

    get displayOrder() {
        // Show visual order if available (add 1 since arrays are 0-based), otherwise fall back to database order
        return this.visualOrder !== null ? (this.visualOrder + 1) : (this.action?.Order__c || 0);
    }


    get statusClass() {
        return !this.action?.Bypass_Execution__c ? 'slds-theme_success' : 'slds-theme_warning';
    }

    get statusLabel() {
        return !this.action?.Bypass_Execution__c ? 'Active' : 'Bypassed';
    }

    get actionType() {
        return this.action?.Flow_Name__c ? 'Flow' : 'Apex';
    }

    get classOrFlowName() {
        return this.action?.Flow_Name__c || this.action?.Apex_Class_Name__c || '';
    }

    get metadataUrl() {
        // Create URL to the custom metadata record
        const baseUrl = window.location.origin;
        return `${baseUrl}/lightning/setup/CustomMetadata/page?address=%2F${this.action.Id}%3Fsetupid%3DCustomMetadata`;
    }

    handleMenuSelect(event) {
        const selectedValue = event.detail.value;
        
        switch (selectedValue) {
            case 'view':
                this.dispatchEvent(new CustomEvent('view', {
                    detail: { actionId: this.action.Id }
                }));
                break;
            case 'edit':
                this.dispatchEvent(new CustomEvent('edit', {
                    detail: { actionId: this.action.Id }
                }));
                break;
        }
    }

    handleMoveUp() {
        this.dispatchEvent(new CustomEvent('moveaction', {
            detail: { 
                actionId: this.action.Id,
                direction: 'up'
            }
        }));
    }

    handleMoveDown() {
        this.dispatchEvent(new CustomEvent('moveaction', {
            detail: { 
                actionId: this.action.Id,
                direction: 'down'
            }
        }));
    }
}



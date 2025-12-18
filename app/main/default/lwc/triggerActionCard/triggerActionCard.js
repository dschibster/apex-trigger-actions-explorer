import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getFlowActiveVersionId from '@salesforce/apex/TriggerActionsExplorerController.getFlowActiveVersionId';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TriggerActionCard extends NavigationMixin(LightningElement) {
    @api action;
    @api isEditOrderMode = false;
    @api isManualEditMode = false;
    @api isFirstItem = false;
    @api isLastItem = false;
    @api visualOrder = null; // Visual position in the list (1, 2, 3...)
    @api showDragIcon = false;

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
        // Always show the actual Order__c value from the database, not the visual position
        return this.action?.Order__c || 0;
    }


    get entryCriteriaLabel() {
        return this.action?.Entry_Criteria__c ? 'Filtered' : 'Unfiltered';
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

    get isFlowAction() {
        return !!this.action?.Flow_Name__c;
    }

    get manualOrderValue() {
        // Return the manual order if set, otherwise fall back to the original order
        return this.action?.manualOrder !== undefined ? this.action.manualOrder : (this.action?.Order__c || 0);
    }

    get metadataUrl() {
        // Create URL to the custom metadata record
        const baseUrl = window.location.origin;
        return `${baseUrl}/lightning/setup/CustomMetadata/page?address=%2F${this.action.Id}%3Fsetupid%3DCustomMetadata`;
    }

    emitCanDrag() {
        const dragEvent = new CustomEvent('candrag', {
            detail: { actionId: this.action.Id }
        });
        this.dispatchEvent(dragEvent);
    }

    emitCannotDrag() {
        const noDragEvent = new CustomEvent('cannotdrag', {
            detail: { actionId: this.action.Id }
        });
        this.dispatchEvent(noDragEvent);
    }

    async handleMenuSelect(event) {
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
            case 'flowbuilder':
                await this.handleOpenFlowBuilder();
                break;
        }
    }

    async handleOpenFlowBuilder() {
        try {
            const flowApiName = this.action?.Flow_Name__c;
            if (!flowApiName) {
                this.showToast('Error', 'Flow name not found', 'error');
                return;
            }

            // Get the ActiveVersionId from Apex
            const activeVersionId = await getFlowActiveVersionId({ flowApiName });
            
            if (!activeVersionId) {
                this.showToast('Error', 'Flow not found or not active', 'error');
                return;
            }

            // Navigate to Flow Builder using the ActiveVersionId
            // URL format: /builder_platform_interaction/flowBuilder.app?flowId={ActiveVersionId}
            // Use relative URL for internal Salesforce navigation
            const flowBuilderUrl = `/builder_platform_interaction/flowBuilder.app?flowId=${activeVersionId}`;
            
            // Use NavigationMixin to navigate to the Flow Builder
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: flowBuilderUrl
                }
            });
        } catch (error) {
            console.error('Error opening Flow Builder:', error);
            this.showToast('Error', 'Failed to open Flow Builder: ' + (error.body?.message || error.message), 'error');
        }
    }

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
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

    handleManualOrderChange(event) {
        const orderValue = event.target.value;
        
        // Validate 4 decimal places
        const decimalPlaces = (orderValue.toString().split('.')[1] || '').length;
        if (decimalPlaces > 4) {
            event.target.setCustomValidity('Maximum 4 decimal places allowed');
            event.target.reportValidity();
            return;
        } else {
            event.target.setCustomValidity('');
        }

        this.dispatchEvent(new CustomEvent('manualorderchange', {
            detail: { 
                actionId: this.action.Id,
                orderValue: orderValue // Keep as string to preserve exact value
            }
        }));
    }

    handleManualOrderBlur(event) {
        const orderValue = event.target.value;
        
        // Validate 4 decimal places
        const decimalPlaces = (orderValue.toString().split('.')[1] || '').length;
        if (decimalPlaces > 4) {
            event.target.setCustomValidity('Maximum 4 decimal places allowed');
            event.target.reportValidity();
            return;
        } else {
            event.target.setCustomValidity('');
        }

        // Trigger reordering when field loses focus
        this.dispatchEvent(new CustomEvent('manualorderblur', {
            detail: { 
                actionId: this.action.Id,
                orderValue: orderValue
            }
        }));
    }
}



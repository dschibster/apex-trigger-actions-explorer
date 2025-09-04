# Trigger Action Modal Integration Example

This document demonstrates how the upsert functionality has been integrated with the modal's update button, including proper data structure and refresh functionality.

## Integration Overview

The integration includes:
1. **Structured JSON Data**: Uses proper Trigger Action field names instead of arbitrary JSON
2. **Modal Update Integration**: Update button calls the upsert method
3. **Loading States**: Shows loading spinner during update operations
4. **Error Handling**: Comprehensive error handling with toast notifications
5. **Auto Refresh**: Automatically refreshes data after successful updates

## Data Structure

The modal now passes structured Trigger Action data with proper field names:

```javascript
// Example of the data structure passed to upsertTriggerAction
const actionData = {
    Id: "My_Trigger_Action", // DeveloperName
    DeveloperName: "My_Trigger_Action",
    Label: "My Trigger Action",
    Description__c: "Updated description",
    Order__c: 1,
    Apex_Class_Name__c: "MyApexHandler",
    Flow_Name__c: null,
    Entry_Criteria__c: "Field__c != null",
    Required_Permission__c: "CustomPermission",
    Bypass_Permission__c: "AdminPermission",
    Bypass_Execution__c: false,
    Allow_Flow_Recursion__c: false,
    Before_Insert__c: "Account_Trigger_Setting",
    After_Insert__c: null,
    Before_Update__c: null,
    After_Update__c: "Account_Trigger_Setting",
    Before_Delete__c: null,
    After_Delete__c: null,
    After_Undelete__c: null
};
```

## User Flow

1. **User opens modal**: Clicks "Edit" on a trigger action card
2. **Modal loads**: Displays current trigger action data in edit mode
3. **User modifies data**: Changes fields in the modal form
4. **User clicks Update**: Triggers the update process
5. **Loading state**: Modal shows loading spinner and disables buttons
6. **Backend processing**: Calls `upsertTriggerAction` with structured data
7. **Success handling**: Shows success toast and closes modal
8. **Auto refresh**: Parent component refreshes data to show updates
9. **Error handling**: Shows error toast if update fails

## Code Flow

### 1. Modal Update Handler
```javascript
// In triggerActionModal.js
handleUpdate() {
    this.dispatchEvent(new CustomEvent('update', {
        detail: { 
            actionId: this.action.Id,
            actionData: this.actionData  // Structured data with proper field names
        }
    }));
}
```

### 2. Parent Component Handler
```javascript
// In triggerActionsExplorer.js
async handleModalUpdate(event) {
    const { actionId, actionData } = event.detail;
    
    try {
        this.isUpdating = true;
        this.error = null;
        
        // Call upsert with structured JSON
        const jobId = await upsertTriggerAction({ 
            actionData: JSON.stringify(actionData) 
        });
        
        // Show success and refresh
        this.showToast('Success', 'Trigger Action updated successfully', 'success');
        this.handleModalClose();
        await this.loadData(); // Refresh data
        
    } catch (error) {
        this.error = error.body?.message || error.message || 'Failed to update trigger action';
        this.showToast('Error', this.error, 'error');
    } finally {
        this.isUpdating = false;
    }
}
```

### 3. Backend Processing
```apex
// In TriggerActionsExplorerController.cls
@AuraEnabled
public static String upsertTriggerAction(String actionData) {
    try {
        // Parse structured JSON
        Map<String, Object> actionMap = (Map<String, Object>) JSON.deserializeUntyped(actionData);
        
        // Extract DeveloperName (required field)
        String developerName = (String) actionMap.get('DeveloperName');
        if (String.isBlank(developerName)) {
            developerName = (String) actionMap.get('Name');
        }
        if (String.isBlank(developerName)) {
            developerName = (String) actionMap.get('Id');
        }
        
        // Create metadata record with proper field mapping
        Metadata.CustomMetadata customMetadata = new Metadata.CustomMetadata();
        customMetadata.fullName = 'Trigger_Action__mdt.' + developerName;
        customMetadata.label = (String) actionMap.get('Label');
        
        // Map all fields using proper field names
        addFieldValue(customMetadata, 'Description__c', (String) actionMap.get('Description__c'));
        addFieldValue(customMetadata, 'Apex_Class_Name__c', (String) actionMap.get('Apex_Class_Name__c'));
        // ... etc for all fields
        
        // Deploy metadata
        Metadata.DeployContainer mdContainer = new Metadata.DeployContainer();
        mdContainer.addMetadata(customMetadata);
        
        Metadata.DeployCallback callback = new TriggerActionDeployCallback();
        Id jobId = Metadata.Operations.enqueueDeployment(mdContainer, callback);
        
        return String.valueOf(jobId);
        
    } catch (Exception e) {
        throw new AuraHandledException('Error upserting trigger action: ' + e.getMessage());
    }
}
```

## UI States

### Loading State
- Modal shows loading spinner
- Update button is disabled
- Form fields are hidden
- "Updating Trigger Action..." message displayed

### Success State
- Success toast notification
- Modal closes automatically
- Data refreshes to show updates
- Loading state cleared

### Error State
- Error toast notification
- Modal remains open for retry
- Error message displayed
- Loading state cleared

## Benefits

1. **Type Safety**: Uses proper field names instead of arbitrary JSON keys
2. **User Experience**: Clear loading states and feedback
3. **Error Handling**: Comprehensive error handling with user-friendly messages
4. **Data Consistency**: Auto-refresh ensures UI shows current data
5. **Metadata API Integration**: Proper use of Salesforce Metadata API for custom metadata operations

## Testing

To test the integration:

1. Open the Trigger Actions Explorer
2. Select a trigger setting and context
3. Click "Edit" on any trigger action
4. Modify some fields in the modal
5. Click "Update"
6. Verify loading state appears
7. Check for success toast and modal closure
8. Verify data refreshes with updated values

## Error Scenarios

The integration handles various error scenarios:

- **Missing DeveloperName**: Shows error if required field is missing
- **Metadata API failures**: Catches and displays deployment errors
- **Network issues**: Handles connection problems gracefully
- **Permission errors**: Shows appropriate permission-related messages
- **Validation errors**: Displays field validation issues

All errors are shown as toast notifications with descriptive messages to help users understand and resolve issues.

# Trigger Actions Metadata API Usage Guide

This document explains how to use the newly implemented backend methods for managing Trigger Action custom metadata records using the Salesforce Metadata API.

## Prerequisites

Before using these methods, ensure that:

1. **Apex Metadata API is enabled** in your Salesforce organization
2. **Required permissions** are granted:
   - System Administrator role (has these permissions by default)
   - OR create a permission set with "Author Apex" permission for non-admin users
3. **Custom metadata type** `Trigger_Action__mdt` exists with all required fields

## Available Methods

### 1. upsertTriggerAction(String actionData)

Creates or updates a Trigger Action custom metadata record.

**Parameters:**
- `actionData` (String): JSON string containing the trigger action data

**Required Fields:**
- `developerName`: The DeveloperName for the custom metadata record
- `label`: The Master Label for the custom metadata record

**Optional Fields:**
- `description`: Description of the trigger action
- `apexClassName`: Name of the Apex class to execute
- `flowName`: Name of the Flow to execute
- `entryCriteria`: Entry criteria for the action
- `requiredPermission`: Required permission to execute
- `bypassPermission`: Permission to bypass execution
- `order`: Execution order (numeric)
- `bypassExecution`: Whether to bypass execution (boolean)
- `allowFlowRecursion`: Whether to allow Flow recursion (boolean)
- `beforeInsert`: sObject for before insert context
- `afterInsert`: sObject for after insert context
- `beforeUpdate`: sObject for before update context
- `afterUpdate`: sObject for after update context
- `beforeDelete`: sObject for before delete context
- `afterDelete`: sObject for after delete context
- `afterUndelete`: sObject for after undelete context

**Returns:**
- String containing the deployment job ID

**Example Usage:**
```javascript
// In LWC JavaScript
const actionData = {
    developerName: 'Account_Validation_Action',
    label: 'Account Validation Action',
    description: 'Validates account data before insert',
    apexClassName: 'AccountValidationHandler',
    order: 1,
    bypassExecution: false,
    beforeInsert: 'Account_Trigger_Setting'
};

const result = await upsertTriggerAction({ actionData: JSON.stringify(actionData) });
console.log('Deployment Job ID:', result);
```

### 2. deleteTriggerAction(String developerName)

Deletes a Trigger Action custom metadata record.

**Parameters:**
- `developerName` (String): The DeveloperName of the custom metadata record to delete

**Returns:**
- String containing the deployment job ID

**Example Usage:**
```javascript
// In LWC JavaScript
const result = await deleteTriggerAction({ developerName: 'Account_Validation_Action' });
console.log('Deployment Job ID:', result);
```

### 3. getDeploymentStatus(String jobId)

Gets the deployment status for a given job ID.

**Parameters:**
- `jobId` (String): The deployment job ID to check

**Returns:**
- String containing deployment status information

**Example Usage:**
```javascript
// In LWC JavaScript
const status = await getDeploymentStatus({ jobId: '0Af...' });
console.log('Deployment Status:', status);
```

## JSON Data Structure Examples

### Creating a New Trigger Action
```json
{
    "developerName": "Contact_Email_Validation",
    "label": "Contact Email Validation",
    "description": "Validates email format for contacts",
    "apexClassName": "ContactEmailValidator",
    "order": 2,
    "bypassExecution": false,
    "allowFlowRecursion": false,
    "beforeInsert": "Contact_Trigger_Setting",
    "afterUpdate": "Contact_Trigger_Setting"
}
```

### Updating an Existing Trigger Action
```json
{
    "developerName": "Contact_Email_Validation",
    "label": "Contact Email Validation Updated",
    "description": "Updated email validation logic with additional checks",
    "apexClassName": "ContactEmailValidatorV2",
    "order": 1,
    "bypassExecution": false,
    "allowFlowRecursion": true,
    "beforeInsert": "Contact_Trigger_Setting",
    "afterUpdate": "Contact_Trigger_Setting",
    "entryCriteria": "Email != null"
}
```

## Error Handling

All methods include comprehensive error handling:

- **Validation errors**: Missing required fields
- **Metadata API errors**: Deployment failures
- **System errors**: Unexpected exceptions

Errors are thrown as `AuraHandledException` with descriptive messages.

## Deployment Process

1. **Asynchronous**: Metadata deployments are asynchronous
2. **Job ID**: Each deployment returns a job ID for tracking
3. **Status Monitoring**: Use `getDeploymentStatus()` or check Setup > Deploy > Deployment Status
4. **Callback Handling**: The `TriggerActionDeployCallback` class handles deployment results

## Best Practices

1. **Always validate input data** before calling the methods
2. **Handle deployment job IDs** for tracking purposes
3. **Check deployment status** before assuming operations completed
4. **Use meaningful DeveloperNames** that follow naming conventions
5. **Test in sandbox** before deploying to production
6. **Monitor debug logs** for deployment details

## Limitations

1. **Asynchronous operations**: Deployments are not immediate
2. **Metadata API limits**: Subject to Salesforce API limits
3. **Permission requirements**: Requires specific permissions
4. **Custom metadata only**: Only works with custom metadata types, not standard objects

## Troubleshooting

### Common Issues

1. **Permission denied**: Ensure user has "Author Apex" permission
2. **Metadata API not enabled**: Enable in Setup > Apex Settings
3. **Invalid field values**: Check field types and required fields
4. **Deployment failures**: Check debug logs for specific error messages

### Debug Information

The callback class logs detailed information about deployments:
- Success/failure status
- Component failures
- Error details
- Deployment results

Check the debug logs for comprehensive deployment information.

public with sharing class TriggerActionsExplorerController {
    
    @AuraEnabled(cacheable=false)
    public static List<sObject_Trigger_Setting__mdt> getTriggerSettings(String timestamp) {
        try {
            // Query actual SObject Trigger Settings from custom metadata
            // Note: Bypass_Execution__c = false means the trigger is ACTIVE
            List<sObject_Trigger_Setting__mdt> settings = [
                SELECT Id, DeveloperName, Label, Object_API_Name__c, Bypass_Execution__c, Bypass_Permission__c, Required_Permission__c
                FROM sObject_Trigger_Setting__mdt
                ORDER BY Object_API_Name__c ASC
            ];
            
            return settings;
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving trigger settings: ' + e.getMessage());
        }
    }
    
    
    /**
     * Creates or updates a Trigger Action custom metadata record using the Metadata API
     * @param actionData JSON string containing the trigger action data
     * @return String containing the deployment job ID
     */
    @AuraEnabled
    public static String upsertTriggerAction(String actionData) {
        try {
            // Parse the incoming JSON data
            Map<String, Object> actionMap = (Map<String, Object>) JSON.deserializeUntyped(actionData);
            
            // Extract required fields - use DeveloperName from the action data
            String developerName = (String) actionMap.get('DeveloperName');
            String label = (String) actionMap.get('Label');
            
            // If DeveloperName is not provided, try to get it from the Id or Name field
            if (String.isBlank(developerName)) {
                developerName = (String) actionMap.get('Name');
            }
            
            // If still blank, try to extract from Id
            if (String.isBlank(developerName)) {
                String id = (String) actionMap.get('Id');
                if (String.isNotBlank(id)) {
                    // Extract DeveloperName from the Id (assuming it's the DeveloperName)
                    developerName = id;
                }
            }
            
            if (String.isBlank(developerName)) {
                throw new AuraHandledException('DeveloperName is required to identify the trigger action');
            }
            
            // Use DeveloperName as label if label is not provided
            if (String.isBlank(label)) {
                label = developerName;
            }
            
            // Create the custom metadata record
            Metadata.CustomMetadata customMetadata = new Metadata.CustomMetadata();
            customMetadata.fullName = 'Trigger_Action__mdt.' + developerName;
            customMetadata.label = label;
            
            // Add field values using the actual field names from the Trigger Action data
            addFieldValue(customMetadata, 'Description__c', (String) actionMap.get('Description__c'));
            addFieldValue(customMetadata, 'Apex_Class_Name__c', (String) actionMap.get('Apex_Class_Name__c'));
            addFieldValue(customMetadata, 'Flow_Name__c', (String) actionMap.get('Flow_Name__c'));
            addFieldValue(customMetadata, 'Entry_Criteria__c', (String) actionMap.get('Entry_Criteria__c'));
            addFieldValue(customMetadata, 'Required_Permission__c', (String) actionMap.get('Required_Permission__c'));
            addFieldValue(customMetadata, 'Bypass_Permission__c', (String) actionMap.get('Bypass_Permission__c'));
            
            // Add numeric fields
            addNumericFieldValue(customMetadata, 'Order__c', actionMap.get('Order__c'));
            
            // Add boolean fields
            addBooleanFieldValue(customMetadata, 'Bypass_Execution__c',  actionMap.get('Bypass_Execution__c'));
            addBooleanFieldValue(customMetadata, 'Allow_Flow_Recursion__c', actionMap.get('Allow_Flow_Recursion__c'));
            
            // Add trigger context fields (MetadataRelationship fields)
            addFieldValue(customMetadata, 'Before_Insert__c', (String) actionMap.get('Before_Insert__c'));
            addFieldValue(customMetadata, 'After_Insert__c', (String) actionMap.get('After_Insert__c'));
            addFieldValue(customMetadata, 'Before_Update__c', (String) actionMap.get('Before_Update__c'));
            addFieldValue(customMetadata, 'After_Update__c', (String) actionMap.get('After_Update__c'));
            addFieldValue(customMetadata, 'Before_Delete__c', (String) actionMap.get('Before_Delete__c'));
            addFieldValue(customMetadata, 'After_Delete__c', (String) actionMap.get('After_Delete__c'));
            addFieldValue(customMetadata, 'After_Undelete__c', (String) actionMap.get('After_Undelete__c'));
            
            // Deploy the metadata
            Metadata.DeployContainer mdContainer = new Metadata.DeployContainer();
            mdContainer.addMetadata(customMetadata);
            
            // Create callback and deploy
            Metadata.DeployCallback callback = new TriggerActionDeployCallback();
            Id jobId = Metadata.Operations.enqueueDeployment(mdContainer, callback);
            
            
            return String.valueOf(jobId);
            
        } catch (Exception e) {
            
            // For validation errors or other pre-deployment issues, we should still try to publish a platform event
            // to provide consistent error handling to the frontend
            try {
                String currentUserId = UserInfo.getUserId();
                TriggerActionsExplorerCallback__e callbackEvent = new TriggerActionsExplorerCallback__e();
                callbackEvent.UserId__c = currentUserId;
                callbackEvent.Status__c = 'failed';
                
                String errorMessage = 'Error upserting trigger action: ' + e.getMessage();
                if (errorMessage.length() > 255) {
                    errorMessage = errorMessage.substring(0, 252) + '...';
                }
                callbackEvent.Message__c = errorMessage;
                
                Database.SaveResult publishResult = EventBus.publish(callbackEvent);
                if (publishResult.isSuccess()) {
                } else {
                }
            } catch (Exception publishException) {
            }
            
            throw new AuraHandledException('Error upserting trigger action: ' + e.getMessage());
        }
    }
    
    /**
     * Upserts a SObject Trigger Setting custom metadata record using the Metadata API
     * @param settingDataJson JSON string containing the setting data
     * @return String containing the deployment job ID
     */
    @AuraEnabled
    public static String upsertTriggerSetting(String settingDataJson) {
        try {
            
            Map<String, Object> settingMap = (Map<String, Object>) JSON.deserializeUntyped(settingDataJson);
            
            // Extract required fields
            String developerName = (String) settingMap.get('DeveloperName');
            String label = (String) settingMap.get('Label');
            
            
            // DeveloperName is always required
            if (String.isBlank(developerName)) {
                throw new AuraHandledException('DeveloperName is required');
            }
            
            // Label is only required for new records (when it's provided and not blank)
            // For updates, we might not have the label in the data
            if (String.isBlank(label)) {
                // For updates, we'll use the DeveloperName as the label if no label is provided
                label = developerName;
            }
            
            // Create CustomMetadata object
            Metadata.CustomMetadata customMetadata = new Metadata.CustomMetadata();
            customMetadata.fullName = 'sObject_Trigger_Setting__mdt.' + developerName;
            customMetadata.label = label;
            
            // Add field values
            addFieldValue(customMetadata, 'Object_API_Name__c', (String) settingMap.get('Object_API_Name__c'));
            addFieldValue(customMetadata, 'Object_Namespace__c', (String) settingMap.get('Object_Namespace__c'));
            addFieldValue(customMetadata, 'TriggerRecord_Class_Name__c', (String) settingMap.get('TriggerRecord_Class_Name__c'));
            addFieldValue(customMetadata, 'Required_Permission__c', (String) settingMap.get('Required_Permission__c'));
            addFieldValue(customMetadata, 'Bypass_Permission__c', (String) settingMap.get('Bypass_Permission__c'));
            
            // Add boolean fields
            try {
                Object bypassExecutionValue = settingMap.get('Bypass_Execution__c');
                addBooleanFieldValue(customMetadata, 'Bypass_Execution__c', bypassExecutionValue);
            } catch (Exception booleanException) {
                throw new AuraHandledException('Error processing boolean field: ' + booleanException.getMessage());
            }
            
            
            // Deploy the metadata
            Metadata.DeployContainer mdContainer = new Metadata.DeployContainer();
            mdContainer.addMetadata(customMetadata);
            
            // Create callback and deploy
            Metadata.DeployCallback callback = new TriggerActionDeployCallback();
            Id jobId = Metadata.Operations.enqueueDeployment(mdContainer, callback);
            
            
            return String.valueOf(jobId);
            
        } catch (Exception e) {
            
            // For validation errors or other pre-deployment issues, we should still try to publish a platform event
            // to provide consistent error handling to the frontend
            try {
                String currentUserId = UserInfo.getUserId();
                TriggerActionsExplorerCallback__e callbackEvent = new TriggerActionsExplorerCallback__e();
                callbackEvent.UserId__c = currentUserId;
                callbackEvent.Status__c = 'failed';
                
                String errorMessage = 'Error upserting trigger setting: ' + e.getMessage();
                if (errorMessage.length() > 255) {
                    errorMessage = errorMessage.substring(0, 252) + '...';
                }
                callbackEvent.Message__c = errorMessage;
                
                Database.SaveResult publishResult = EventBus.publish(callbackEvent);
                if (publishResult.isSuccess()) {
                } else {
                }
            } catch (Exception publishException) {
            }
            
            throw new AuraHandledException('Error upserting trigger setting: ' + e.getMessage());
        }
    }
    
    
    /**
     * Helper method to add string field values to custom metadata
     */
    private static void addFieldValue(Metadata.CustomMetadata customMetadata, String fieldName, String value) {
        if (String.isNotBlank(value)) {
            Metadata.CustomMetadataValue fieldValue = new Metadata.CustomMetadataValue();
            fieldValue.field = fieldName;
            fieldValue.value = value;
            customMetadata.values.add(fieldValue);
        }
    }
    
    /**
     * Helper method to add numeric field values to custom metadata
     */
    private static void addNumericFieldValue(Metadata.CustomMetadata customMetadata, String fieldName, Object value) {
        if (value != null) {
            Metadata.CustomMetadataValue fieldValue = new Metadata.CustomMetadataValue();
            fieldValue.field = fieldName;
            fieldValue.value = Decimal.valueOf(String.valueOf(value));
            customMetadata.values.add(fieldValue);
        }
    }
    
    /**
     * Helper method to add boolean field values to custom metadata
     */
    private static void addBooleanFieldValue(Metadata.CustomMetadata customMetadata, String fieldName, Object value) {
        if (value != null) {
            Metadata.CustomMetadataValue fieldValue = new Metadata.CustomMetadataValue();
            fieldValue.field = fieldName;
            fieldValue.value = Boolean.valueOf(value);
            customMetadata.values.add(fieldValue);
        }
    }
    
    /**
     * Gets the current user ID for platform event filtering
     * @return String containing the current user ID
     */
    @AuraEnabled
    public static String getCurrentUserId() {
        return UserInfo.getUserId();
    }
    
    /**
     * Retrieves all Trigger Action custom metadata records
     * @return List of Trigger Action custom metadata records
     */
    @AuraEnabled(cacheable=false)
    public static List<Trigger_Action__mdt> getTriggerActions(String timestamp) {
        try {
            
            // Query all Trigger Action custom metadata records
            List<Trigger_Action__mdt> actions = [
                SELECT Id, DeveloperName, Label, Description__c, Order__c, 
                       Required_Permission__c, Bypass_Execution__c, Bypass_Permission__c,
                       Apex_Class_Name__c, Flow_Name__c, Allow_Flow_Recursion__c,
                       Entry_Criteria__c, Before_Insert__c, After_Insert__c,
                       Before_Update__c, After_Update__c, Before_Delete__c,
                       After_Delete__c, After_Undelete__c
                FROM Trigger_Action__mdt
                ORDER BY Order__c ASC, DeveloperName ASC
            ];
            
            return actions;
            
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving trigger actions: ' + e.getMessage());
        }
    }
    
    /**
     * Updates the order of multiple trigger actions using the Metadata API
     * @param actionsData JSON string containing array of action data with updated order values
     * @return String containing the deployment job ID
     */
    @AuraEnabled
    public static String updateTriggerActionsOrder(String actionsData) {
        try {
            
            // Parse the actions data
            List<Object> actionsList = (List<Object>) JSON.deserializeUntyped(actionsData);
            
            // Create metadata container for batch update
            Metadata.DeployContainer mdContainer = new Metadata.DeployContainer();
            
            // Process each action
            for (Object actionObj : actionsList) {
                Map<String, Object> actionMap = (Map<String, Object>) actionObj;
                
                String developerName = (String) actionMap.get('DeveloperName');
                Decimal orderValue = (Decimal) actionMap.get('Order__c');
                
                
                // Create custom metadata instance
                Metadata.CustomMetadata customMetadata = new Metadata.CustomMetadata();
                customMetadata.fullName = 'Trigger_Action__mdt.' + developerName;
                customMetadata.label = (String) actionMap.get('Label') != null ? (String) actionMap.get('Label') : developerName;
                
                // Add Order field
                Metadata.CustomMetadataValue orderField = new Metadata.CustomMetadataValue();
                orderField.field = 'Order__c';
                orderField.value = orderValue;
                customMetadata.values.add(orderField);
                
                // Add to deployment container
                mdContainer.addMetadata(customMetadata);
            }
            
            
            // Create callback and deploy
            Metadata.DeployCallback callback = new TriggerActionDeployCallback();
            Id jobId = Metadata.Operations.enqueueDeployment(mdContainer, callback);
            
            return String.valueOf(jobId);
            
        } catch (Exception e) {
            
            // Publish platform event for error handling
            try {
                String currentUserId = UserInfo.getUserId();
                TriggerActionsExplorerCallback__e callbackEvent = new TriggerActionsExplorerCallback__e();
                callbackEvent.UserId__c = currentUserId;
                callbackEvent.Status__c = 'failed';
                callbackEvent.Message__c = 'Error updating trigger actions order: ' + e.getMessage();
                EventBus.publish(callbackEvent);
            } catch (Exception eventException) {
            }
            
            throw new AuraHandledException('Error updating trigger actions order: ' + e.getMessage());
        }
    }
    
    /**
     * Validates if a DeveloperName is unique for Trigger Actions
     * @param developerName The DeveloperName to validate
     * @return Boolean indicating if the DeveloperName is unique
     */
    @AuraEnabled
    public static Boolean validateDeveloperNameUnique(String developerName) {
        try {
            if (String.isBlank(developerName)) {
                return false;
            }
            
            // Query for existing Trigger Action with this DeveloperName
            List<Trigger_Action__mdt> existingActions = [
                SELECT Id, DeveloperName 
                FROM Trigger_Action__mdt 
                WHERE DeveloperName = :developerName.trim()
                LIMIT 1
            ];
            
            return existingActions.isEmpty();
            
        } catch (Exception e) {
            // If there's an error, assume it's not unique to be safe
            return false;
        }
    }
    
}

public with sharing class TriggerActionsExplorerController {
    
    @AuraEnabled(cacheable=true)
    public static List<sObject_Trigger_Setting__mdt> getTriggerSettings() {
        try {
            // Query actual SObject Trigger Settings from custom metadata
            // Note: Bypass_Execution__c = false means the trigger is ACTIVE
            List<sObject_Trigger_Setting__mdt> settings = [
                SELECT Id, DeveloperName, Object_API_Name__c, Bypass_Execution__c, Bypass_Permission__c, Required_Permission__c
                FROM sObject_Trigger_Setting__mdt
                ORDER BY Object_API_Name__c ASC
            ];
            
            System.debug('Retrieved trigger settings: ' + settings.size());
            return settings;
        } catch (Exception e) {
            System.debug('Error retrieving trigger settings: ' + e.getMessage());
            throw new AuraHandledException('Error retrieving trigger settings: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Trigger_Action__mdt> getTriggerActions() {
        try {
            // Query actual Trigger Actions from custom metadata
            // Note: Bypass_Execution__c = false means the action is ACTIVE
            List<Trigger_Action__mdt> actions = [
                SELECT Id, DeveloperName, Before_Insert__c, After_Insert__c, Before_Update__c, After_Update__c,
                       Before_Delete__c, After_Delete__c, After_Undelete__c, Order__c, Bypass_Execution__c,
                       Bypass_Permission__c, Required_Permission__c, Apex_Class_Name__c, Description__c,
                       Entry_Criteria__c, Flow_Name__c, Allow_Flow_Recursion__c
                FROM Trigger_Action__mdt
                ORDER BY Order__c ASC, DeveloperName ASC
            ];
            
            System.debug('Retrieved trigger actions: ' + actions.size());
            return actions;
        } catch (Exception e) {
            System.debug('Error retrieving trigger actions: ' + e.getMessage());
            throw new AuraHandledException('Error retrieving trigger actions: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static String createTriggerAction(String actionData) {
        try {
            // TODO: Implement trigger action creation
            // This would involve creating/updating custom metadata records
            return 'Success';
        } catch (Exception e) {
            throw new AuraHandledException('Error creating trigger action: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static String updateTriggerAction(String actionId, String actionData) {
        try {
            // TODO: Implement trigger action update
            return 'Success';
        } catch (Exception e) {
            throw new AuraHandledException('Error updating trigger action: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static String deleteTriggerAction(String actionId) {
        try {
            // TODO: Implement trigger action deletion
            return 'Success';
        } catch (Exception e) {
            throw new AuraHandledException('Error deleting trigger action: ' + e.getMessage());
        }
    }
}

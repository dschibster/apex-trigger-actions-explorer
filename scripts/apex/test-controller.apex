// Test script for TriggerActionsExplorerController
// Run this in Developer Console or via anonymous apex

System.debug('=== Testing TriggerActionsExplorerController ===');

try {
    // Test getTriggerSettings
    System.debug('Testing getTriggerSettings...');
    List<sObject_Trigger_Setting__mdt> settings = TriggerActionsExplorerController.getTriggerSettings();
    System.debug('Retrieved settings: ' + settings.size());
    for(sObject_Trigger_Setting__mdt setting : settings) {
        System.debug('Setting: ' + setting.DeveloperName + ' - Object API Name: ' + setting.Object_API_Name__c + ' - Bypass Execution: ' + setting.Bypass_Execution__c);
    }
    
    // Test getTriggerActions
    System.debug('Testing getTriggerActions...');
    List<Trigger_Action__mdt> actions = TriggerActionsExplorerController.getTriggerActions();
    System.debug('Retrieved actions: ' + actions.size());
    for(Trigger_Action__mdt action : actions) {
        System.debug('Action: ' + action.DeveloperName + ' - Apex Class: ' + action.Apex_Class_Name__c + ' - Order: ' + action.Order__c);
        System.debug('  Before Insert: ' + action.Before_Insert__c);
        System.debug('  After Insert: ' + action.After_Insert__c);
        System.debug('  Before Update: ' + action.Before_Update__c);
        System.debug('  After Update: ' + action.After_Update__c);
        System.debug('  Before Delete: ' + action.Before_Delete__c);
        System.debug('  After Delete: ' + action.After_Delete__c);
        System.debug('  After Undelete: ' + action.After_Undelete__c);
    }
    
    // Test data relationships
    if (settings.size() > 0 && actions.size() > 0) {
        System.debug('=== Testing Relationships ===');
        sObject_Trigger_Setting__mdt firstSetting = settings[0];
        System.debug('First Setting ID: ' + firstSetting.Id + ' - DeveloperName: ' + firstSetting.DeveloperName);
        
        // Find actions that reference this setting
        List<Trigger_Action__mdt> relatedActions = new List<Trigger_Action__mdt>();
        for(Trigger_Action__mdt action : actions) {
            if (action.Before_Insert__c == firstSetting.Id || 
                action.After_Insert__c == firstSetting.Id ||
                action.Before_Update__c == firstSetting.Id ||
                action.After_Update__c == firstSetting.Id ||
                action.Before_Delete__c == firstSetting.Id ||
                action.After_Delete__c == firstSetting.Id ||
                action.After_Undelete__c == firstSetting.Id) {
                relatedActions.add(action);
            }
        }
        System.debug('Found ' + relatedActions.size() + ' actions related to first setting');
    }
    
    System.debug('=== All tests completed successfully ===');
    
} catch (Exception e) {
    System.debug('Error during testing: ' + e.getMessage());
    System.debug('Stack trace: ' + e.getStackTraceString());
}

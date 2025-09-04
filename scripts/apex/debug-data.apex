// Debug script to understand the data structure
// Run this in Developer Console

System.debug('=== DEBUGGING TRIGGER ACTIONS DATA ===');

try {
    // Test 1: Check trigger settings
    System.debug('=== TRIGGER SETTINGS ===');
    List<sObject_Trigger_Setting__mdt> settings = [
        SELECT Id, DeveloperName, Object_API_Name__c, Bypass_Execution__c
        FROM sObject_Trigger_Setting__mdt
        WHERE Bypass_Execution__c = false
        LIMIT 5
    ];
    
    System.debug('Found ' + settings.size() + ' trigger settings');
    for(sObject_Trigger_Setting__mdt setting : settings) {
        System.debug('Setting: ' + setting.DeveloperName + ' - Object: ' + setting.Object_API_Name__c + ' - ID: ' + setting.Id);
    }
    
    // Test 2: Check trigger actions
    System.debug('=== TRIGGER ACTIONS ===');
    List<Trigger_Action__mdt> actions = [
        SELECT Id, DeveloperName, Before_Insert__c, After_Insert__c, Before_Update__c, After_Update__c,
               Before_Delete__c, After_Delete__c, After_Undelete__c, Order__c, Apex_Class_Name__c
        FROM Trigger_Action__mdt
        WHERE Bypass_Execution__c = false
        LIMIT 10
    ];
    
    System.debug('Found ' + actions.size() + ' trigger actions');
    for(Trigger_Action__mdt action : actions) {
        System.debug('Action: ' + action.DeveloperName + ' - Apex Class: ' + action.Apex_Class_Name__c);
        System.debug('  Before Insert: ' + action.Before_Insert__c);
        System.debug('  After Insert: ' + action.After_Insert__c);
        System.debug('  Before Update: ' + action.Before_Update__c);
        System.debug('  After Update: ' + action.After_Update__c);
        System.debug('  Before Delete: ' + action.Before_Delete__c);
        System.debug('  After Delete: ' + action.After_Delete__c);
        System.debug('  After Undelete: ' + action.After_Undelete__c);
    }
    
    // Test 3: Check relationships
    if (settings.size() > 0 && actions.size() > 0) {
        System.debug('=== RELATIONSHIP TEST ===');
        sObject_Trigger_Setting__mdt firstSetting = settings[0];
        System.debug('Testing with first setting: ' + firstSetting.DeveloperName + ' (ID: ' + firstSetting.Id + ')');
        
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
                System.debug('Found related action: ' + action.DeveloperName);
            }
        }
        System.debug('Total related actions: ' + relatedActions.size());
    }
    
    System.debug('=== DEBUG COMPLETE ===');
    
} catch (Exception e) {
    System.debug('Error during debugging: ' + e.getMessage());
    System.debug('Stack trace: ' + e.getStackTraceString());
}

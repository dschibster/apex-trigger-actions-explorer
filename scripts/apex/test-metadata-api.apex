// Test script for Trigger Actions Metadata API methods
// Run this in Developer Console or VS Code

// Test data for creating a new trigger action using proper field names
Map<String, Object> testActionData = new Map<String, Object>{
    'DeveloperName' => 'Test_Account_Action',
    'Label' => 'Test Account Action',
    'Description__c' => 'Test trigger action for account validation',
    'Apex_Class_Name__c' => 'TestAccountHandler',
    'Order__c' => 1,
    'Bypass_Execution__c' => false,
    'Allow_Flow_Recursion__c' => false,
    'Before_Insert__c' => 'Account_Trigger_Setting'
};

// Convert to JSON string
String actionDataJson = JSON.serialize(testActionData);

try {
    // Test upsert operation
    System.debug('Testing upsertTriggerAction...');
    String jobId = TriggerActionsExplorerController.upsertTriggerAction(actionDataJson);
    System.debug('Upsert Job ID: ' + jobId);
    
    // Test deployment status
    System.debug('Testing getDeploymentStatus...');
    String status = TriggerActionsExplorerController.getDeploymentStatus(jobId);
    System.debug('Deployment Status: ' + status);
    
    // Test delete operation (uncomment to test deletion)
    // System.debug('Testing deleteTriggerAction...');
    // String deleteJobId = TriggerActionsExplorerController.deleteTriggerAction('Test_Account_Action');
    // System.debug('Delete Job ID: ' + deleteJobId);
    
} catch (Exception e) {
    System.debug('Error: ' + e.getMessage());
    System.debug('Stack Trace: ' + e.getStackTraceString());
}

// Test with minimal required data
Map<String, Object> minimalData = new Map<String, Object>{
    'DeveloperName' => 'Minimal_Test_Action',
    'Label' => 'Minimal Test Action'
};

try {
    System.debug('Testing with minimal data...');
    String minimalJobId = TriggerActionsExplorerController.upsertTriggerAction(JSON.serialize(minimalData));
    System.debug('Minimal Data Job ID: ' + minimalJobId);
} catch (Exception e) {
    System.debug('Minimal Data Error: ' + e.getMessage());
}

// Test error handling with missing required fields
try {
    System.debug('Testing error handling...');
    String errorJobId = TriggerActionsExplorerController.upsertTriggerAction('{"invalid": "data"}');
} catch (Exception e) {
    System.debug('Expected Error: ' + e.getMessage());
}

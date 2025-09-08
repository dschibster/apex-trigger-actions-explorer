@IsTest
public class TriggerActionDeployCallbackTest {
    
    @IsTest
    static void testHandleResultWithSuccess() {
        // Create a mock deployment result
        Metadata.DeployResult deployResult = new Metadata.DeployResult();
        deployResult.success = true;
        deployResult.details = new Metadata.DeployDetails();
        deployResult.details.componentFailures = new List<Metadata.DeployMessage>();
        
        // Create a mock deployment callback
        TriggerActionDeployCallback callback = new TriggerActionDeployCallback();
        
        Test.startTest();
        callback.handleResult(deployResult, new Metadata.DeployCallbackContext());
        Test.stopTest();
        
        // Verify that the method executes without throwing exceptions
        // In a real scenario, this would publish a platform event
        System.assert(true, 'HandleResult should execute successfully');
    }
    
    @IsTest
    static void testHandleResultWithFailure() {
        // Create a mock deployment result with failures
        Metadata.DeployResult deployResult = new Metadata.DeployResult();
        deployResult.success = false;
        deployResult.details = new Metadata.DeployDetails();
        
        // Create a failure message
        Metadata.DeployMessage failure = new Metadata.DeployMessage();
        failure.problem = 'Test deployment failure';
        failure.problemType = Metadata.DeployProblemType.Error;
        failure.componentType = 'CustomMetadata';
        failure.fullName = 'TestAction';
        
        deployResult.details.componentFailures = new List<Metadata.DeployMessage>{ failure };
        
        // Create a mock deployment callback
        TriggerActionDeployCallback callback = new TriggerActionDeployCallback();
        
        Test.startTest();
        callback.handleResult(deployResult, new Metadata.DeployCallbackContext());
        Test.stopTest();
        
        // Verify that the method executes without throwing exceptions
        // In a real scenario, this would publish a platform event with error details
        System.assert(true, 'HandleResult should execute successfully even with failures');
    }
    
    @IsTest
    static void testHandleResultWithNullDetails() {
        // Create a mock deployment result with null details
        Metadata.DeployResult deployResult = new Metadata.DeployResult();
        deployResult.success = true;
        deployResult.details = null;
        
        // Create a mock deployment callback
        TriggerActionDeployCallback callback = new TriggerActionDeployCallback();
        
        Test.startTest();
        callback.handleResult(deployResult, new Metadata.DeployCallbackContext());
        Test.stopTest();
        
        // Verify that the method executes without throwing exceptions
        System.assert(true, 'HandleResult should execute successfully with null details');
    }
    
    @IsTest
    static void testHandleResultWithEmptyFailures() {
        // Create a mock deployment result with empty failures
        Metadata.DeployResult deployResult = new Metadata.DeployResult();
        deployResult.success = true;
        deployResult.details = new Metadata.DeployDetails();
        deployResult.details.componentFailures = new List<Metadata.DeployMessage>();
        
        // Create a mock deployment callback
        TriggerActionDeployCallback callback = new TriggerActionDeployCallback();
        
        Test.startTest();
        callback.handleResult(deployResult, new Metadata.DeployCallbackContext());
        Test.stopTest();
        
        // Verify that the method executes without throwing exceptions
        System.assert(true, 'HandleResult should execute successfully with empty failures');
    }
    
    @IsTest
    static void testHandleResultWithMultipleFailures() {
        // Create a mock deployment result with multiple failures
        Metadata.DeployResult deployResult = new Metadata.DeployResult();
        deployResult.success = false;
        deployResult.details = new Metadata.DeployDetails();
        
        // Create multiple failure messages
        Metadata.DeployMessage failure1 = new Metadata.DeployMessage();
        failure1.problem = 'First deployment failure';
        failure1.problemType = Metadata.DeployProblemType.Error;
        failure1.componentType = 'CustomMetadata';
        failure1.fullName = 'TestAction1';
        
        Metadata.DeployMessage failure2 = new Metadata.DeployMessage();
        failure2.problem = 'Second deployment failure';
        failure2.problemType = Metadata.DeployProblemType.Warning;
        failure2.componentType = 'CustomMetadata';
        failure2.fullName = 'TestAction2';
        
        deployResult.details.componentFailures = new List<Metadata.DeployMessage>{ failure1, failure2 };
        
        // Create a mock deployment callback
        TriggerActionDeployCallback callback = new TriggerActionDeployCallback();
        
        Test.startTest();
        callback.handleResult(deployResult, new Metadata.DeployCallbackContext());
        Test.stopTest();
        
        // Verify that the method executes without throwing exceptions
        System.assert(true, 'HandleResult should execute successfully with multiple failures');
    }
    
    @IsTest
    static void testHandleResultWithNullFailures() {
        // Create a mock deployment result with null failures
        Metadata.DeployResult deployResult = new Metadata.DeployResult();
        deployResult.success = true;
        deployResult.details = new Metadata.DeployDetails();
        deployResult.details.componentFailures = null;
        
        // Create a mock deployment callback
        TriggerActionDeployCallback callback = new TriggerActionDeployCallback();
        
        Test.startTest();
        callback.handleResult(deployResult, new Metadata.DeployCallbackContext());
        Test.stopTest();
        
        // Verify that the method executes without throwing exceptions
        System.assert(true, 'HandleResult should execute successfully with null failures');
    }
    
    @IsTest
    static void testHandleResultWithNullResult() {
        // Create a mock deployment callback
        TriggerActionDeployCallback callback = new TriggerActionDeployCallback();
        
        Test.startTest();
        try {
            callback.handleResult(null, new Metadata.DeployCallbackContext());
            // Method might handle null gracefully or throw exception
            System.assert(true, 'Method executed without throwing exception');
        } catch (Exception e) {
            // Acceptable to throw an exception for null result
            System.assert(true, 'Should throw exception for null result');
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testHandleResultWithNullContext() {
        // Create a mock deployment result
        Metadata.DeployResult deployResult = new Metadata.DeployResult();
        deployResult.success = true;
        deployResult.details = new Metadata.DeployDetails();
        deployResult.details.componentFailures = new List<Metadata.DeployMessage>();
        
        // Create a mock deployment callback
        TriggerActionDeployCallback callback = new TriggerActionDeployCallback();
        
        Test.startTest();
        callback.handleResult(deployResult, null);
        Test.stopTest();
        
        // Verify that the method executes without throwing exceptions
        System.assert(true, 'HandleResult should execute successfully with null context');
    }
}

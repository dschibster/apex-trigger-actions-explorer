/**
 * Callback class to handle the results of metadata deployment operations
 * for Trigger Action custom metadata records
 */
public class TriggerActionDeployCallback implements Metadata.DeployCallback {
    
    /**
     * Handles the result of a metadata deployment operation
     * @param result The deployment result containing status and details
     * @param context The deployment callback context
     */
    public void handleResult(Metadata.DeployResult result, Metadata.DeployCallbackContext context) {
        try {
            // Get the current user ID
            String currentUserId = UserInfo.getUserId();
            
            // Create platform event record
            TriggerActionsExplorerCallback__e callbackEvent = new TriggerActionsExplorerCallback__e();
            callbackEvent.UserId__c = currentUserId;
            
            System.debug('Creating platform event with UserId: ' + currentUserId);
            
            if (result.status == Metadata.DeployStatus.Succeeded) {
                System.debug('=== DEPLOYMENT SUCCESS ===');
                System.debug('Deployment ID: ' + result.id);
                System.debug('Deployment success: ' + result.success);
                System.debug('Deployment done: ' + result.done);
                System.debug('Deployment status: ' + result.status);
                
                // Log component details
                if (result.details != null) {
                    System.debug('Component successes count: ' + (result.details.componentSuccesses != null ? result.details.componentSuccesses.size() : 0));
                    System.debug('Component failures count: ' + (result.details.componentFailures != null ? result.details.componentFailures.size() : 0));
                    
                    if (result.details.componentSuccesses != null && !result.details.componentSuccesses.isEmpty()) {
                        for (Metadata.DeployMessage success : result.details.componentSuccesses) {
                            System.debug('SUCCESS: ' + success.fullName + ' - ' + success.componentType);
                        }
                    }
                    
                    if (result.details.componentFailures != null && !result.details.componentFailures.isEmpty()) {
                        for (Metadata.DeployMessage failure : result.details.componentFailures) {
                            System.debug('FAILURE: ' + failure.fullName + ' - ' + failure.problem);
                        }
                    }
                } else {
                    System.debug('WARNING: Deployment details are null despite success status');
                }
                
                callbackEvent.Status__c = 'succeeded';
                callbackEvent.Message__c = 'Trigger Action deployed successfully';
                System.debug('Setting success message: ' + callbackEvent.Message__c);
            } else {
                System.debug('=== DEPLOYMENT FAILED ===');
                System.debug('Deployment status: ' + result.status);
                System.debug('Deployment ID: ' + result.id);
                System.debug('Deployment success: ' + result.success);
                System.debug('Deployment done: ' + result.done);
                callbackEvent.Status__c = 'failed';
                
                // Collect error messages
                String errorMessage = 'Deployment failed';
                if (result.details != null && result.details.componentFailures != null) {
                    List<String> errorMessages = new List<String>();
                    for (Metadata.DeployMessage failure : result.details.componentFailures) {
                        String failureMessage = failure.fullName + ': ' + failure.problem;
                        errorMessages.add(failureMessage);
                        System.debug('Component failure: ' + failureMessage);
                    }
                    if (!errorMessages.isEmpty()) {
                        errorMessage = String.join(errorMessages, '; ');
                    }
                } else if (result.errorMessage != null) {
                    errorMessage = result.errorMessage;
                }
                
                // Truncate message if too long (platform event field limit is 255)
                if (errorMessage.length() > 255) {
                    errorMessage = errorMessage.substring(0, 252) + '...';
                }
                callbackEvent.Message__c = errorMessage;
                System.debug('Setting error message: ' + callbackEvent.Message__c);
            }
            
            // Publish the platform event
            Database.SaveResult publishResult = EventBus.publish(callbackEvent);
            
            if (publishResult.isSuccess()) {
                System.debug('Platform event published successfully for user: ' + currentUserId);
            } else {
                System.debug('Failed to publish platform event: ' + publishResult.getErrors());
            }
            
        } catch (Exception e) {
            System.debug('Error in DeployCallback: ' + e.getMessage());
        }
    }
}
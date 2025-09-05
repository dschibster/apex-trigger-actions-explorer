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
                System.debug('Trigger Action metadata deployment succeeded.');
                System.debug('Deployment details: ' + result);
                callbackEvent.Status__c = 'succeeded';
                callbackEvent.Message__c = 'Trigger Action deployed successfully';
                System.debug('Setting success message: ' + callbackEvent.Message__c);
            } else {
                System.debug('Trigger Action metadata deployment failed.');
                System.debug('Deployment status: ' + result.status);
                System.debug('Error details: ' + result);
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
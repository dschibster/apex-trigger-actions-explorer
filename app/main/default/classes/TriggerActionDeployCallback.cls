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
            
            if (result.status == Metadata.DeployStatus.Succeeded) {
                System.debug('Trigger Action metadata deployment succeeded.');
                System.debug('Deployment details: ' + result);
                callbackEvent.Status__c = 'succeeded';
            } else {
                System.debug('Trigger Action metadata deployment failed.');
                System.debug('Deployment status: ' + result.status);
                System.debug('Error details: ' + result);
                callbackEvent.Status__c = 'failed';
                
                // Log specific error messages if available
                if (result.details != null && result.details.componentFailures != null) {
                    for (Metadata.DeployMessage failure : result.details.componentFailures) {
                        System.debug('Component failure: ' + failure.fullName + ' - ' + failure.problem);
                    }
                }
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
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
        if (result.status == Metadata.DeployStatus.Succeeded) {
            System.debug('Trigger Action metadata deployment succeeded.');
            System.debug('Deployment details: ' + result);
        } else {
            System.debug('Trigger Action metadata deployment failed.');
            System.debug('Deployment status: ' + result.status);
            System.debug('Error details: ' + result);
            
            // Log specific error messages if available
            if (result.details != null && result.details.componentFailures != null) {
                for (Metadata.DeployMessage failure : result.details.componentFailures) {
                    System.debug('Component failure: ' + failure.fullName + ' - ' + failure.problem);
                }
            }
        }
    }
}

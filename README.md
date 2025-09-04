# Trigger Actions Explorer

A Lightning Web Component that allows users to explore and manage trigger actions for different SObjects in Salesforce using the Trigger Actions Framework.

## Features

- **Real-time Data**: Retrieves actual SObject trigger settings and trigger actions from custom metadata types
- **Interactive UI**: Dropdown picklists for selecting SObject and trigger context
- **Dynamic Filtering**: Actions are automatically filtered based on selected SObject and context
- **Responsive Design**: Built with SLDS (Salesforce Lightning Design System) for consistent UI
- **Error Handling**: Comprehensive error handling with user-friendly error messages
- **Loading States**: Loading spinners and proper state management

## Architecture

### Components

- **triggerActionsExplorer**: Main component that orchestrates the entire application
- **triggerActionsSection**: Displays a section of trigger actions (Before/After)
- **triggerActionCard**: Individual card displaying a single trigger action

### Data Flow

1. **Initial Load**: Component connects and automatically fetches data from Apex controller
2. **User Selection**: User selects SObject and trigger context from dropdowns
3. **Dynamic Filtering**: Component filters actions based on selection and updates display
4. **Real-time Updates**: Changes in picklists immediately trigger data refresh

## Setup

### Prerequisites

- Salesforce org with API version 58.0 or higher
- Trigger Actions Framework custom metadata types installed
- Proper permissions to access custom metadata

### Custom Metadata Types

#### sObject_Trigger_Setting__mdt
- `DeveloperName`: Unique identifier for the trigger setting
- `Object_API_Name__c`: The API name of the SObject this trigger setting applies to (e.g., Account, Opportunity)
- `Bypass_Execution__c`: Boolean flag to bypass all trigger actions for this SObject (false = active, true = bypassed)
- `Bypass_Permission__c`: Permission required to bypass this trigger
- `Required_Permission__c`: Permission required to manage this trigger
- `Object_Namespace__c`: Namespace prefix if the object is in a managed package
- `TriggerRecord_Class_Name__c`: Custom Apex class for trigger record handling

#### Trigger_Action__mdt
- `DeveloperName`: Unique identifier for the trigger action
- `Before_Insert__c`, `After_Insert__c`, `Before_Update__c`, `After_Update__c`, `Before_Delete__c`, `After_Delete__c`, `After_Undelete__c`: MetadataRelationship references to sObject_Trigger_Setting__mdt records
- `Order__c`: Execution order for the action within its context
- `Bypass_Execution__c`: Boolean flag to bypass this specific action (false = active, true = bypassed)
- `Apex_Class_Name__c`: The Apex class that implements this action
- `Flow_Name__c`: The Flow that implements this action (alternative to Apex class)
- `Description__c`: Human-readable description of what the action does
- `Entry_Criteria__c`: Criteria that must be met for the action to execute
- `Allow_Flow_Recursion__c`: Boolean flag to allow flow recursion
- `Bypass_Permission__c`: Permission required to bypass this action
- `Required_Permission__c`: Permission required to manage this action

### Installation

1. Deploy the component bundle to your Salesforce org
2. Ensure the Trigger Actions Framework custom metadata types are installed
3. Add the component to a Lightning page or app
4. Ensure custom metadata records exist for the component to display

## Usage

1. **Select SObject**: Choose the SObject you want to explore trigger actions for
2. **Select Context**: Choose the trigger context (Created, Updated, Deleted, Restored)
3. **View Actions**: The component will display Before and After actions for the selected combination
4. **Manage Actions**: Use the edit/delete buttons on action cards to manage individual actions

## Technical Details

### Data Model Relationships

The component works with the actual Trigger Actions Framework data model:

- **sObject_Trigger_Setting__mdt** records define which SObjects have triggers enabled
- **Trigger_Action__mdt** records define individual actions and reference trigger settings via MetadataRelationship fields
- **Context Fields** (Before_Insert__c, After_Update__c, etc.) store the ID of the related trigger setting
- **Active/Inactive Logic**: Uses `Bypass_Execution__c` checkbox where `false` means active and `true` means bypassed
- **Custom Metadata Fields**: Uses `DeveloperName` (not `Name`) as the unique identifier

### Async/Await Implementation

The component uses modern JavaScript async/await patterns for data retrieval:

```javascript
async loadData() {
    try {
        this.isLoading = true;
        const [settings, actions] = await Promise.all([
            getTriggerSettings(),
            getTriggerActions()
        ]);
        // Process data...
    } catch (error) {
        this.error = error.message;
    } finally {
        this.isLoading = false;
    }
}
```

### Reactive Updates

The component automatically updates the display when picklist selections change:

```javascript
async handleSettingChange(event) {
    this.selectedSetting = event.detail.value;
    this.updateDisplayActions(); // Immediately update display
}
```

### Error Handling

Comprehensive error handling with user-friendly messages and proper state management:

- Loading states with spinners
- Error display with clear messaging
- Graceful fallbacks for missing data

## Testing

Use the provided test script (`scripts/apex/test-controller.apex`) to verify the Apex controller works correctly:

```apex
// Run in Developer Console
List<sObject_Trigger_Setting__mdt> settings = TriggerActionsExplorerController.getTriggerSettings();
List<Trigger_Action__mdt> actions = TriggerActionsExplorerController.getTriggerActions();
```

The test script will:
- Verify data retrieval from both metadata types
- Display field values and relationships
- Test the relationship between trigger settings and actions

## Recent Changes

### v2.2 - Custom Metadata Field Corrections
- **Fixed**: Changed `Name` to `DeveloperName` for custom metadata types
- **Updated**: All references throughout the codebase to use correct field names
- **Corrected**: Apex queries and component logic for proper field access

### v2.1 - Data Model Alignment
- **Updated**: Field names to match actual Trigger Actions Framework metadata
- **Fixed**: Apex controller queries to use correct field names
- **Added**: Support for additional fields (Flow_Name__c, Entry_Criteria__c, etc.)
- **Corrected**: Active/inactive logic using Bypass_Execution__c
- **Improved**: Relationship handling between trigger settings and actions

### v2.0 - Real Data Integration
- **Removed**: All dummy/hardcoded data
- **Added**: Apex controller methods to query custom metadata
- **Added**: Async/await data loading with loading states
- **Added**: Error handling and user feedback
- **Added**: Reactive updates based on picklist changes
- **Improved**: Performance by eliminating unnecessary re-renders

### v1.0 - Initial Release
- Basic component structure with dummy data
- Static filtering and display

## Troubleshooting

### Common Issues

1. **No Data Displayed**: 
   - Check that custom metadata records exist and have `Bypass_Execution__c = false`
   - Verify user has access to custom metadata types
   - Ensure Trigger Actions Framework is properly installed

2. **Permission Errors**: 
   - Ensure user has access to custom metadata types
   - Check profile and permission set assignments

3. **Component Not Loading**: 
   - Verify API version compatibility (58.0+)
   - Check component deployment status
   - Review browser console for JavaScript errors

### Debug Information

The component includes comprehensive debug information in the UI to help troubleshoot issues:
- Data counts and types
- Selection states
- Raw data samples
- Relationship information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with actual Trigger Actions Framework data
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Related Projects

- [Trigger Actions Framework](https://github.com/mitchspano/trigger-actions-framework) - The underlying framework that provides the custom metadata structure

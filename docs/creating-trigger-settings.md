# Creating SObject Trigger Settings

SObject Trigger Settings are the starting point that defines whether an object is running in the Trigger Actions Framework. They enable trigger action management for specific Salesforce objects.

## What are Trigger Settings?

SObject Trigger Settings are custom metadata records that define:

- **Object Configuration**: Which Salesforce object participates in the Trigger Actions Framework
- **Namespace Handling**: Support for managed packages
- **TriggerRecord Class**: Optional Apex class for custom Entry Criteria evaluation in Trigger Actions
- **Permissions**: Required and bypass permissions for execution
- **Execution Control**: Whether the trigger is active or bypassed

## Example Configuration

```
Object API Name: Account
Label: Account
TriggerRecord Class: AccountTriggerRecord
```

## Creating a New Trigger Setting

### Step 1: Access the Creation Interface

1. Open the **Trigger Actions Explorer** application
2. Click the **Add New SObject Trigger Setting** button (plus icon) in the top-right corner
3. The Trigger Setting Modal will open

### Step 2: Configure Basic Settings

#### Object API Name
- **Required field**: Enter the API name of the Salesforce object
- **Examples**: `Account`, `Contact`, `Opportunity`, `CustomObject__c`
- **Note**: Use the exact API name as it appears in Salesforce

#### Label
- **Required field**: A user-friendly name for the trigger setting
- **Examples**: "Account Trigger", "Contact Management", "Opportunity Processing"
- **Note**: This will be displayed in the Trigger Settings dropdown

#### Object Namespace
- **Optional field**: For managed packages, enter the namespace
- **Examples**: `mypackage`, `sfdc`, `npsp`
- **Note**: Leave blank for unmanaged objects

### Step 3: Configure Trigger Logic

#### TriggerRecord Class Name
- **Optional field**: Apex class for custom Entry Criteria evaluation in Trigger Actions
- **Examples**: `AccountTriggerRecord`, `ContactTriggerRecord`, `OpportunityTriggerRecord`
- **Note**: Only required if you want to use custom Entry Criteria formulas in Trigger Actions

#### Required Permission
- **Optional field**: Permission required to execute trigger actions
- **Examples**: `CustomPermission`, `SystemPermission`
- **Note**: Only users with this permission will have trigger actions executed

### Step 4: Execution Control

#### Bypass Permission
- **Optional field**: Permission that allows bypassing trigger execution
- **Examples**: `BypassTriggers`, `AdminOverride`
- **Use case**: Users with this permission will skip trigger execution

#### Bypass Execution
- **Checkbox**: When checked, disables all trigger actions for this object
- **Use case**: Temporarily disable triggers without deleting configurations
- **Note**: This is useful for maintenance or troubleshooting

### Step 5: Save the Setting

1. Click **Save** to create the Trigger Setting
2. The modal will close and return to the main interface
3. Your new setting will appear in the SObject dropdown

## Managing Existing Trigger Settings

### Editing a Trigger Setting

1. Click the **Edit SObject Trigger Setting** button (pencil icon)
2. Make your changes in the modal
3. Click **Save** to update the setting

### Viewing Trigger Setting Details

1. Select the Trigger Setting from the dropdown
2. The interface will show all associated trigger actions
3. Use the context and timing dropdowns to filter actions

## Best Practices

### Naming Conventions

- **Labels**: Use descriptive, business-friendly names
- **Object API Names**: Use exact Salesforce API names
- **TriggerRecord Classes**: Follow your org's naming conventions

### Permission Management

- **Required Permissions**: Use sparingly to avoid performance impact
- **Bypass Permissions**: Grant only to administrators and support users
- **Documentation**: Document permission requirements for future reference

### Object Selection

- **Standard Objects**: Account, Contact, Opportunity, Lead, etc.
- **Custom Objects**: Any custom object in your org
- **Platform Events**: Objects ending with `ChangeEvent`
- **Restored Objects**: Objects with `Restored` context

## Common Use Cases

### Account Management
```yaml
Object API Name: Account
Label: Account
TriggerRecord Class: AccountTriggerRecord
```

### Contact Processing
```yaml
Object API Name: Contact
Label: Contact
TriggerRecord Class: ContactTriggerRecord
```

### Custom Object Handling
```yaml
Object API Name: MyCustomObject__c
Label: MyCustomObject
TriggerRecord Class: MyCustomObjectTriggerRecord
```

### Change Data Capture
```yaml
Object API Name: AccountChangeEvent
Label: AccountChangeEvent
TriggerRecord Class: AccountChangeEventTriggerRecord
```

## Next Steps

After creating your Trigger Settings:

1. [Create Trigger Actions](creating-trigger-actions.md) for your settings
2. [Learn about Entry Criteria validation](creating-trigger-actions.md#evaluate-entry-criteria-directly-in-the-ui)
3. [Organize action execution order](sorting-trigger-actions.md)

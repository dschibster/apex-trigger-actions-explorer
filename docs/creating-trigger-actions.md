# Creating Trigger Actions

Trigger Actions define the specific logic that executes when triggers fire on your configured objects. This guide covers creating, editing, and managing trigger actions within the Trigger Actions Explorer.

## What are Trigger Actions?

Trigger Actions are custom metadata records that define:

- **Action Type**: Apex class or Flow execution
- **Execution Context**: Before/After Insert/Update/Delete/Undelete
- **Entry Criteria**: Formula-based conditions for execution
- **Order**: Execution sequence within the same context
- **Permissions**: Required and bypass permissions
- **Description**: Documentation of the action's purpose

## Creating a New Trigger Action

### Step 1: Access the Creation Interface

1. Select your **Trigger Setting** from the SObject dropdown
2. Choose the appropriate **Context** (Before/After)
3. Select the **Timing** (Insert/Update/Delete/Undelete)
4. Click **Add Action** in the desired section (Before Actions or After Actions)

### Step 2: Choose Action Type

The modal will present different action types based on your object selection:

#### Apex Actions
- **Use case**: Custom business logic, complex processing
- **Class Name**: Enter the Apex class that contains your logic
- **Example**: `AccountValidationHandler`, `ContactDuplicateCheck`

#### Flow Actions
- **Use case**: Declarative automation, simple business rules
- **Flow Name**: Enter the Flow API name
- **Recursion Control**: Allow or prevent recursive execution

#### Flow (CDP) Actions
- **Use case**: Change Data Platform events (ChangeEvent objects only)
- **Availability**: Only shown for objects ending with `ChangeEvent`
- **Flow Name**: Enter the Flow API name for CDP processing

### Step 3: Configure Basic Information

#### Developer Name
- **Auto-generated**: Based on your selections and context
- **Format**: `{Actioniname}_{ContextName}`
- **Example**: `AccountSetName_BI`, `AccountSetRiskClass_BU`
- **Note**: Cannot be changed after creation

#### Label
- **Required**: User-friendly name for the action
- **Examples**: "Validate Account Data", "Update Contact Status", "Create Opportunity Tasks"
- **Note**: This appears in the action card display

#### Description
- **Required**: Detailed explanation of what the action does
- **Examples**: "Validates account data before saving", "Updates contact status based on email domain"
- **Note**: Helps other developers understand the action's purpose

### Step 4: Configure Execution Settings

#### Order
- **Purpose**: Determines execution sequence within the same context
- **Format**: Decimal numbers (e.g., 1.0, 1.5, 2.0)
- **Note**: Lower numbers execute first, can be ordered inside of the app

#### Entry Criteria
- **Purpose**: Formula-based conditions for when the action should execute
- **Format**: Salesforce formula syntax
- **Examples**: 
  - `NOT(ISBLANK(record.Email))`
  - `AND(record.Type = "Customer", ISPICKVAL(record.Status,"Active"))`
  - `record.Amount > 10000`
- **Note**: Only executes when formula evaluates to `true`

#### Required Permission
- **Optional**: Permission required to execute this action
- **Examples**: `CustomPermission`, `SystemPermission`
- **Note**: Users without this permission will skip this action

### Step 5: Configure Execution Control

#### Bypass Permission
- **Optional**: Permission that allows bypassing this specific action
- **Examples**: `BypassValidation`, `AdminOverride`
- **Note**: Users with this permission will skip this action

#### Bypass Execution
- **Checkbox**: When checked, disables this specific action
- **Use case**: Temporarily disable an action without deleting it
- **Note**: Useful for troubleshooting or maintenance

## Description of What Means What in a Trigger Action Card

Each trigger action is displayed as a card with the following content:

### Card Structure
- **Order**: Execution order number
- **Header**: Action Label, Action Type, Action Name (Class/Flow), and Entry Criteria indicator
- **Description**: The detailed explanation you provided
- **Badge**: Active/Bypassed status indicator

## Evaluate Entry Criteria Directly in the UI

The Trigger Actions Explorer includes built-in formula validation to help you create accurate Entry Criteria.

### Accessing Formula Validation

1. **Create or Edit** a trigger action
2. **Enter your formula** in the Entry Criteria field
3. **Click the Validate button** (appears below the Text Area)

### Validation Process

The validation system:

1. **Checks syntax**: Ensures your formula is syntactically correct
2. **Validates field references**: Confirms referenced fields exist on the object
3. **Tests formula logic**: Verifies the formula can be evaluated
4. **Returns results**: Shows success or detailed error messages

### Validation Results

#### Success
- **Green checkmark icon** with "Valid!" message
- **Save button enabled**: You can proceed with saving
- **Confidence**: Your formula will work in production

#### Error
- **Red error icon** with detailed error message
- **Save button disabled**: Prevents saving invalid formulas
- **Error details**: Specific information about what's wrong

## Managing Existing Trigger Actions

### Editing Actions

1. **Click the Edit button** (pencil icon) on any action card
2. **Make your changes** in the modal
3. **Validate Entry Criteria** if modified
4. **Click Save** to update the action

### Viewing Actions

1. **Click the View button** (eye icon) on any action card
2. **Review all details** in read-only mode
3. **Close the modal** when finished

### Deleting Actions

This is currently not supported by the Apex Metadata API. To delete an action, click the Action Label (highlighted blue) to visit the Metadata Record and delete it from there.

## Best Practices

### Naming Conventions

- **Labels**: Use descriptive, business-friendly names
- **Descriptions**: Provide clear explanations of purpose
- **Developer Names**: Let the system auto-generate for consistency

### Entry Criteria Design

- **Test thoroughly**: Use the validation feature
- **Keep it simple**: Avoid overly complex formulas
- **Document logic**: Explain complex conditions in descriptions

### Permission Management

- **Use sparingly**: Only add permissions when necessary
- **Document requirements**: Explain why permissions are needed
- **Test with different users**: Verify permission behavior

### Order Management

- **Plan execution order**: Consider dependencies between actions
- **Use decimal ordering**: Allows for easy insertion of new actions
- **Document dependencies**: Note which actions depend on others

## Troubleshooting

### Common Issues

#### "Formula validation failed"
- Check formula syntax
- Verify field names are correct
- Ensure object has the referenced fields

#### "Action not executing"
- Check Entry Criteria formula
- Verify action is not bypassed
- Confirm execution order is correct

### Validation Errors

#### Syntax Errors
- **Missing parentheses**: Check for balanced parentheses
- **Invalid operators**: Use correct comparison operators
- **Field references**: Ensure field names are exact

#### Field Reference Errors
- **Non-existent fields**: Verify fields exist on the object
- **Incorrect field types**: Check field data types
- **Permission issues**: Ensure access to referenced fields

## Next Steps

After creating your trigger actions:

1. [Organize execution order](sorting-trigger-actions.md) using the sorting features
2. Test your configurations thoroughly

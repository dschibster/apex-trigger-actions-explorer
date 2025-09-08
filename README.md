# Trigger Actions Explorer

A Salesforce Lightning Web Component application for managing trigger actions and their execution order across different objects and contexts.

## Installation

Trigger Actions Explorer requires the latest version of the Trigger Actions Framework to be installed (as of now, Version 0.3.3). Other versions of the framework may work with the explorer, but it is not guaranteed.


#### Production
<div>
<a href="https://login.salesforce.com/packaging/installPackage.apexp?p0=04tXX" target="_blank">
  <img width="180" alt="Deploy to Salesforce"
       src="https://github.com/dschibster/apex-trigger-actions-explorer/blob/main/res/deploy_unlocked.png?raw=true">
</a>

<a href="https://githubsfdeploy.herokuapp.com">
  <img width="180" alt="Deploy to Salesforce"
       src="https://github.com/dschibster/apex-trigger-actions-explorer/blob/main/res/deploy_unmanaged.png?raw=true">
</a>
</div>

#### Sandbox

<div>
<a href="https://test.salesforce.com/packaging/installPackage.apexp?p0=04tXX" target="_blank">
  <img width="180" alt="Deploy to Salesforce"
       src="https://github.com/dschibster/apex-trigger-actions-explorer/blob/main/res/deploy_unlocked.png?raw=true">
</a>
</div>

1. **Unlocked Package** (Recommended): Click the install button above to install the unlocked package directly into your Salesforce org.

2. **Manual Installation**: Copy the contents of this repository into your own Salesforce project and deploy using your preferred method (SFDX CLI, VS Code, etc.).

## Key Features

* Manage trigger actions with the same intuitive workflow as Flow Trigger Explorer
* Create and edit trigger actions from a unified interface
* Mass update execution orders through visual reordering or precise decimal entry
* Create new SObject Trigger Settings and Actions directly from the UI
* Automatically handles the distinction between Change Events and regular objects
* Provides context-appropriate options for specialized objects like platform events

## Screenshots

*[Screenshot: Main interface showing object selector and trigger action sections]*
*[Screenshot: Edit order mode with manual decimal entry (1.5, 2.25, 3.75)]*
*[Screenshot: Create/edit action modal with Flow (CDP) option]*

## Technical Limitations

DeveloperName editing and deletions are not yet supported by the Apex Metadata API.

## Support

Feel free to create issues or pull requests with suggested fixes or problems. We welcome contributions and feedback to improve the application.

## Disclaimer

**Code Generation Notice**: This application was developed with significant assistance from Claude (Anthropic's AI assistant). While the core functionality and business logic were designed collaboratively, much of the implementation code was generated and refined through AI assistance. The final codebase represents a collaborative effort between human design requirements and AI implementation capabilities.
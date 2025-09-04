import { LightningElement, api } from 'lwc';

export default class ActionSummary extends LightningElement {
    @api totalActions;

    connectedCallback() {
        console.log('=== ActionSummary connected ===');
        console.log('Total Actions:', this.totalActions);
        console.log('=== End connected ===');
    }
}

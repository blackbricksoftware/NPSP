import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { registerListener, unregisterListener } from 'c/pubsubNoPageRef';

import NAME_FIELD from '@salesforce/schema/DataImportBatch__c.Name';
import CUSTOM_LABELS from './helpers/customLabels';
import BatchTotals from './helpers/batchTotals';

export default class GeBatchGiftEntryHeader extends LightningElement {

    LABELS = CUSTOM_LABELS;
    ACTIONS = Object.freeze({
        DRY_RUN_BATCH: 'DRY_RUN_BATCH',
        PROCESS_BATCH: 'PROCESS_BATCH',
        EDIT_BATCH: 'EDIT_BATCH'
    });

    @api batchId;
    @api isPermissionError;

    @track batchTotals = {}

    connectedCallback() {
        registerListener('geBatchGiftEntryTableChangeEvent', this.retrieveBatchTotals, this);
        this.retrieveBatchTotals();
    }

    disconnectedCallback() {
        unregisterListener('geBatchGiftEntryTableChangeEvent', this.retrieveBatchTotals, this);
    }

    async retrieveBatchTotals() {
        this.batchTotals = await BatchTotals(this.batchId);

        if(this.batchTotals.hasPaymentsWithExpiredAuthorizations) {
            const detail = {
                modalProperties: {
                    componentName: 'gePurchaseCallModalError',
                    showCloseButton: false
                }
            };
            this.dispatchEvent(new CustomEvent('togglemodal', { detail }));
        }
    }

    @wire(getRecord, {
        recordId: '$batchId',
        fields: NAME_FIELD
    })
    batch;

    get batchName() {
        return getFieldValue(this.batch.data, NAME_FIELD);
    }

    get shouldDisplayHeaderDetails() {
        return this.batchTotals.hasValuesGreaterThanZero;
    }

    handleClick(event) {
        const action =  event.target.getAttribute('data-action');
        switch (action) {
            case this.ACTIONS.DRY_RUN_BATCH:
                this.dispatchEvent(new CustomEvent('batchdryrun'));
                break;
            case this.ACTIONS.PROCESS_BATCH:
                this.dispatchEvent(new CustomEvent('processbatch'));
                break;
            case this.ACTIONS.EDIT_BATCH:
                this.editBatch();
                break;
        }
    }

    editBatch() {
        this.dispatchEvent(new CustomEvent(
            'edit', { detail: this.batchId }
        ));
    }

    get qaLocatorBatchDryRun() {
        return `button ${this.LABELS.bgeBatchDryRun}`;
    }
    get qaLocatorProcessBatch() {
        return `button ${this.LABELS.bgeProcessBatch}`;
    }
    get qaLocatorEditBatchInfo() {
        return `button ${this.LABELS.geEditBatchInfo}`;
    }
}

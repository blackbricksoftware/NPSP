import { api, LightningElement, track, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import DATA_IMPORT from '@salesforce/schema/DataImport__c';
import PAYMENT_FIELD from '@salesforce/schema/DataImport__c.Payment_Method__c';
import donationHistoryDatatableAriaLabel from '@salesforce/label/c.donationHistoryDatatableAriaLabel';
import RD2_ScheduleVisualizerColumnDate from '@salesforce/label/c.RD2_ScheduleVisualizerColumnDate';
import getDonationHistory from '@salesforce/apex/DonationHistoryController.getDonationHistory';
import commonAmount from '@salesforce/label/c.commonAmount';
import donationHistoryDonorLabel from '@salesforce/label/c.donationHistoryDonorLabel';
export default class DonationHistoryTable extends LightningElement {
    @api contactId;

    _filter;
    
    recordsToLoad = 50;

    paymentMethodLabel;

    totalNumberOfRows;

    tableElement;

    allData = [];

    data = [];

    label = {
        donationHistoryDatatableAriaLabel,
    }

    columns = [];

    @api
    get filter() {
        return this._filter;
    }

    set filter(value) {
        this._filter = value;
        this.retrieveDonationHistory();
    }

    @wire(getObjectInfo, { objectApiName: DATA_IMPORT })
    oppInfo({ data, error }) {
        if (data) {
            this.paymentMethodLabel = data.fields[PAYMENT_FIELD.fieldApiName].label
        };
        this.columns = [
            { label: RD2_ScheduleVisualizerColumnDate, fieldName: 'closeDate', type: 'date-local', typeAttributes:{
                year: "numeric",
                month: "numeric",
                day: "numeric",
            },
            cellAttributes: { alignment: 'right' }},
            { label: donationHistoryDonorLabel, fieldName: 'name', type: 'text' },
            { label: commonAmount, fieldName: 'amount', type: 'currency', },
            { label: this.paymentMethodLabel, fieldName: 'paymentMethod', type: 'text', },
        ];
    }
    
    connectedCallback() {
        this.retrieveDonationHistory();
    }
    // eslint-disable-next-line @lwc/lwc/no-async-await
    async retrieveDonationHistory() {
        getDonationHistory({contactId: this.contactId, filter : this.filter})
        .then(data => {
            if (data) {
                this.allData = data;
                this.data = data.slice(0, this.recordsToLoad);
                this.totalNumberOfRows = data.length;
                console.info(this.allData);
            }
        });
    }
    /**
     * 
     * @param {*} event 
     * handle the scroll event to get more content and concat to the existing table data
     */
    loadMoreDonationData(event){
        event.target.isLoading = true;
        if (this.data.length >= this.totalNumberOfRows) {
            event.target.enableInfiniteLoading = false;
            event.target.isLoading = false;
            return;
        }
        const current = this.data.length;
        const offset = current + this.recordsToLoad;
        const currentData = this.data;
        //Appends new data to the end of the table
        const newData = currentData.concat(this.allData.slice(current, offset));
        this.data = newData;
        event.target.isLoading = false;
    }
}
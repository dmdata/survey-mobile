var _ = require('lib/underscore')._;
var Question = require('models/question');
var Response = require('models/response')

var Survey = new Ti.App.joli.model({
	table : 'survey',
	columns : {
		id : 'INTEGER PRIMARY KEY',
		name : 'TEXT',
		description : 'TEXT',
		expiry_date : 'TEXT'
	},

	methods : {
		fetchSurveys : function() {
			var url = Ti.App.Properties.getString('server_url') + '/api/surveys';
			var that = this;
			var client = Ti.Network.createHTTPClient({
				// function called when the response data is available
				onload : function(e) {
					Ti.API.info("Received text: " + this.responseText);
					var data = JSON.parse(this.responseText);
					// Emptying the table for now (until we get all the survey info from the server)
					that.truncate();
					Question.truncate();
					_(data).each(function(surveyData) {
						var survey = that.createRecord(surveyData);
						survey.fetchQuestions();
					});
					Ti.App.fireEvent('surveys.fetch.success');
				},
				// function called when an error occurs, including a timeout
				onerror : function(e) {
					Ti.API.debug(e.error);
					Ti.App.fireEvent('surveys.fetch.error', {
						status : this.status
					});
				},
				timeout : 5000 // in milliseconds
			});
			// Prepare the connection.
			client.open("GET", url);
			// Send the request.
			client.send();
		},

		createRecord : function(surveyData) {
			var record = this.newRecord({
				id : surveyData.id,
				name : surveyData.name,
				description : surveyData.description,
				expiry_date : surveyData.expiry_date
			});
			record.save();
			return record;
		},

		isEmpty : function() {
			return this.count() == 0;
		},
	},
	objectMethods : {
		syncResponses : function() {
			var success_count = 0;
			var self = this;
			
			var syncHandler = function(data) {
				Ti.API.info("All RESPONSES SYNCED: " + self.allResponsesSynced().toString())
				if (data.survey_id == self.id) {
					if (self.allResponsesSynced()) {
						Ti.App.fireEvent("survey.responses.sync", self.syncSummary());
						Ti.API.info("SUMMARY: " + self.syncSummary());
						Ti.App.removeEventListener("response.sync", syncHandler);
					};
				}
			};

			Ti.App.addEventListener("response.sync", syncHandler);

			_(this.responses()).each(function(response) {
				response.sync();
			});
		},

		responses : function() {
			this.response_objects = this.response_objects || Response.findBy('survey_id', this.id);
			return this.response_objects
		},

		allResponsesSynced : function() {
			return _(this.responses()).all(function(response) {
				return response.synced === true;
			});
		},
		
		syncSummary : function() {
			return _(this.responses()).countBy(function(response){
				return response.has_error ? 'errors' : 'successes'
			});
		},

		fetchQuestions : function() {
			var self = this;
			var url = Ti.App.Properties.getString('server_url') + '/api/questions?survey_id=' + self.id;
			var client = Ti.Network.createHTTPClient({
				// function called when the response data is available
				onload : function(e) {
					Ti.API.info("Received text for questions: " + this.responseText);
					var data = JSON.parse(this.responseText);
					Question.createRecords(data, self.id);
				},
				// function called when an error occurs, including a timeout
				onerror : function(e) {
					Ti.API.info("Error");
				},
				timeout : 5000 // in milliseconds
			});
			// Prepare the connection.
			client.open("GET", url);
			// Send the request.
			client.send();
		},
	}
});

Ti.App.joli.models.initialize();
module.exports = Survey;


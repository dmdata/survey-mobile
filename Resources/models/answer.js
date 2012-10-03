var _ = require('lib/underscore')._;
var Question = require('models/question');

var Answer = new Ti.App.joli.model({
	table : 'answers',
	columns : {
		id : 'INTEGER PRIMARY KEY',
		content : 'TEXT',
		response_id : 'INTEGER',
		question_id : 'INTEGER'
	},

	methods : {
		createRecord : function(answerData, responseID) {
			var _ = require('lib/underscore')._;
			var that = this;
			answerData.response_id = responseID
			that.newRecord(answerData).save();
			Ti.API.info("boooo" + _(this.all()).map(function(answer) {
				return answer.response_id
			}));
		},

		validate : function(answerData) {
			var question = Question.findOneById(answerData.question_id);
			var errors = {};
			if (question.max_length && (answerData.content.length > question.max_length))
				errors['max_length'] = "You have exceeded the maximum length for this question";
			if (question.mandatory && !answerData.content)
				errors['mandatory'] = "This question is mandatory";
			return errors;
		}
	}
});

Ti.App.joli.models.initialize();
module.exports = Answer;


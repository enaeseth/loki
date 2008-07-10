UI.Multiple_Items_Error = function MultipleItemsError(message) {
	Error.call(this, message);
	this.name = 'UI.Multiple_Items_Error';
};

UI.Multiple_Items_Error.prototype = new Error();

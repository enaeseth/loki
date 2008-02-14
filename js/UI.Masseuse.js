/**
 * Declares instance variables.
 * @param {UI.Loki}	the Loki instance for which this masseuse will massage
 * @constructor
 *
 * @class Represents a body masseuse, to replace elements 
 * inconvenient to edit with fake elements that are convenient 
 * to edit. For extending only.
 */
UI.Masseuse = function(loki)
{
	this.loki = loki;

	/**
	 * Massages the given node's descendants, replacing any elements inconvenient 
	 * to edit with convenient ones.
	 * @param {HTMLElement} an element node in the document being edited in Loki
	 */
	this.massage_node_descendants = function(node)
	{
	};
	
	/**
	 * Unmassages the given node's descendants, replacing any convenient but fake
	 * elements with real ones.
	 * @param {HTMLElement} an element node in the document being edited in Loki
	 */
	this.unmassage_node_descendants = function(node)
	{
	};
};

/**
 * Legacy initializer function; do not use.
 */
UI.Masseuse.prototype.init = function(loki)
{
	this._loki = this.loki = loki;
	return this;
};

/**
 * Convenience function for massaging the body of the Loki editing document.
 */
UI.Masseuse.prototype.massage_body = function massage_body()
{
	this.massage_node_descendants(this.loki.body);
}

/**
 * Convenience function for unmassaging the body of the Loki editing document.
 */
UI.Masseuse.prototype.unmassage_body = function massage_body()
{
	this.unmassage_node_descendants(this.loki.body);
}

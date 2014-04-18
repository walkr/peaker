Nodes = new Meteor.Collection('nodes');
Pings = new Meteor.Collection('pings');
PingInterval = 1000 * 60 * 5;

if (Meteor.isClient) {

    // Show current time in the dashboard
    var showTime = function() {
        var tokens = Date().split(' ')
        var now = tokens.slice(0, 3).join(' ') + ', ' + tokens.slice(4, -2).join(' ');
        $("#current-time").html(now);
    }
    showTime();
    Meteor.setInterval(showTime, 1000);


    // Templates
    Template.header.events({
        'click #toggle-console': function(e) {
            var el = $(e.target);
            $("#interact").slideToggle();
            $("#cli").focus();
            el.html((el.html() == 'show console' && 'hide console') || 'show console');
        }
    });

    Template.cli.events({
        'keyup input': function(e) {
            if (e.which == 13) {
                var input = $(e.target);
                var address = input.val().trim();
                if (address){
                    Nodes.insert({
                        'address': input.val()
                    });
                    input.val('');
                }

            }
        }
    });

    Template.nodes.nodes = function() {
        return Nodes.find({}, {
            sort: {
                status: 1
            }
        });
    }

    Template.node.events({
        'click .node-deleter': function() {
            Nodes.remove({
                '_id': this._id
            });
        },
        'mouseenter': function(e) {
            $(e.target).find('.node-deleter').toggle();
        },
        'mouseleave': function(e) {
            $(e.target).find('.node-deleter').toggle();
        }
    });

}


// Ping the remote node
var ping = function(node) {
    var address = (node.address.indexOf('http') == -1) ? 'http://' + node.address : node.address;
    HTTP.get(address, function(err, res) {
        node.status = ((res.statusCode == 200) && 'online') || 'offline';
        node.timestamp = new Date().getTime();
        Nodes.update({
            '_id': node._id
        }, node);
        // Insert new ping log
        Pings.insert({
            address: node.address,
            timestamp: node.timestamp,
            status: res.statusCode
        });
    });
}


if (Meteor.isServer) {

    Meteor.startup(function() {
        console.log('Starting peaker app.')
        console.log('Pinging nodes every', PingInterval, 'ms');
    });

    // Ping nodes on an interval
    Meteor.setInterval(function() {
        console.log('Pinging nodes ...')
        Nodes.find({}).forEach(function(node) {
            ping(node);
        });
    }, PingInterval);
}
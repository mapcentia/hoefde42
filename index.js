'use strict';

/**
 * @type {*|exports|module.exports}
 */
var React = require('react');

var cloud;

var layerGroupMouseOver = L.layerGroup();

var layerGroupAll = L.layerGroup();

var utils;

var mapObj;

var exId = "hoefde42Search";

var mainSearch;

var conflictSearch;

var items = {};

module.exports = {
    set: function (o) {
        cloud = o.cloud;
        utils = o.utils;
        mapObj = cloud.get().map;
        mainSearch = o.extensions.vidisearch.index;
        conflictSearch = o.extensions.conflictSearch.index;
    },

    init: function () {
        mainSearch.registerSearcher({
            key: 'Harboøre Tange',
            obj: {'searcher': this, 'title': 'Harboøre Tange'}
        });
    },


    search: function (searchTerm) {
        let url = 'https://rm.mapcentia.com/api/v2/elasticsearch/search/roenland_gl_fabrik/hoefde42/areas_join';
        let query = {
            "_source": {
                "excludes": [
                    "properties.text"
                ]
            },
            "size": 1000,
            "query": {
                "bool": {
                    "should": [
                        {
                            "match": {
                                "properties.text": {
                                    "query" : searchTerm,
                                    "operator" : "and"
                                }
                            }
                        },
                        {
                            "match": {
                                "properties.tags": searchTerm
                            }
                        },
                        {
                            "match": {
                                "properties.omraade": searchTerm
                            }
                        }
                    ]
                }
            }


        };

        return new Promise(function (resolve, reject) {
            $.post(url, JSON.stringify(query), function (data) {
                layerGroupAll.clearLayers();
                let res = data.hits.hits.map((item) => {
                    let it = item._source.properties;
                    items[it.gid] = item._source;
                    let geom = item._source.geometry;
                    let layer = L.geoJson(geom, {
                        "color": "grey",
                        "weight": 1,
                        "opacity": 1,
                        "fillOpacity": 0.1,
                        "dashArray": '5,3'
                    });
                    layerGroupAll.addLayer(layer).addTo(mapObj);
                    return {'title': it.links, 'id': it.gid};
                });
                resolve(res);
            }, 'json');
        });
    },

    handleMouseOver: function (searchTerm, res) {
        return new Promise(function (resolve, reject) {
            let geom = items[searchTerm].geometry;
            let layer = L.geoJson(geom, {
                "color": "blue",
                "weight": 1,
                "opacity": 1,
                "fillOpacity": 0.1,
                "dashArray": '5,3'
            });

            layerGroupMouseOver.clearLayers();
            layerGroupMouseOver.addLayer(layer).addTo(mapObj);
            resolve();
        });
    },

    handleMouseOut: function (searchTerm, res) {
        return new Promise(function (resolve, reject) {
            layerGroupMouseOver.clearLayers();
            resolve();
        });
    },

    handleSearch: function (searchTerm) {
        conflictSearch.clearDrawing();
        layerGroupAll.clearLayers();

        return new Promise(function (resolve, reject) {
            let geom = items[searchTerm].geometry;
            let properties = items[searchTerm].properties;
            let layer = L.geoJson(geom, {
                "color": "blue",
                "weight": 1,
                "opacity": 1,
                "fillOpacity": 0.1,
                "dashArray": '5,3'
            });

            layerGroupMouseOver.clearLayers();
            layerGroupMouseOver.addLayer(layer).addTo(mapObj);
            mapObj.fitBounds(layer.getBounds());
            let comp = <div>
                <ul className="list-group">
                    <li className="list-group-item">
                        <a style={{textDecoration: "underline"}} href={properties.url}
                           target="_blank">{properties.links}</a>
                    </li>
                    <li className="list-group-item">Tags : <Tags items={properties.tags.split("|")}/></li>
                    <li className="list-group-item">Områder : <Tags items={properties.omraade.split("|")}/></li>
                </ul>
                <div><ConflictSearch /></div>
            </div>;
            resolve(comp);
        });
    }
};

class ConflictSearch extends React.Component {
    makeSearch() {
        // Activate Conflict
        $('#main-tabs a[href="#conflict-content"]').tab('show');
        // Switch on Conflict
        let conflictSwitch = $("#conflict-btn");
        if (!conflictSwitch.is(':checked')) {
            conflictSwitch.trigger("click");
        }
        // Clear existing drawings
        conflictSearch.clearDrawing();
        // Add layer from Search
        conflictSearch.addDrawing(layerGroupMouseOver._layers[Object.keys(layerGroupMouseOver._layers)[0]]);
        // Run Conflict
        conflictSearch.makeSearch("Fra Røland dl._fabrik");
    }

    render() {
        return (
            <button className="btn btn-raised" onClick={this.makeSearch}>Konfliktsøgning <i className="material-icons">arrow_forward</i></button>
        );
    }
}

class Tags extends React.Component {
    render() {
        var items = this.props.items.map((item, index) => {
            return (
                <li key={index.toString()} style={{
                    color: "white",
                    background: "#03a9f4",
                    display: "inline-block",
                    padding: "2px",
                    margin: "2px"
                }}> {item} </li>
            );
        });
        return (
            <ul style={{listStyleType: "none"}} className="list-group"> {items} </ul>
        );
    }
}

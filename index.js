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

var currentSearchId;

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


    search: function (searchTerm, e) {
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
                    "must": []
                }
            }

        };

        //currentSearchId = e ? e.target.id : currentSearchId;

        if (searchTerm.tagValue !== "") {
            query.query.bool.must.push({
                "match": {
                    "properties.tags": {
                        "query": searchTerm.tagValue,
                        "operator": "and"
                    }
                }
            })
        }
        if (searchTerm.textValue !== "") {
            query.query.bool.must.push({
                "match": {
                    "properties.text": {
                        "query": searchTerm.textValue,
                        "operator": "and"
                    }
                }
            })
        }
        if (searchTerm.omraadeValue !== "" && searchTerm.omraadeValue !== "Vælg område") {
            query.query.bool.must.push({
                "match": {
                    "properties.omraade": {
                        "query": searchTerm.omraadeValue,
                        "operator": "and"
                    }
                }
            })
        }
        if (searchTerm.refValue !== "") {
            query.query.bool.must.push({
                "match": {
                    "properties.reference": {
                        "query": searchTerm.refValue,
                        "operator": "and"
                    }
                }
            })
        }

        return new Promise(function (resolve, reject) {
            $.ajax({
                url: url,
                type: "POST",
                data: JSON.stringify(query),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (data) {
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
                }
            })
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
                <div><ConflictSearch/></div>
            </div>;
            resolve(comp);
        });
    }
};

class ConflictSearch extends React.Component {
    makeSearch() {
        // Activate Conflict
        $('#main-tabs a[href="#conflict-content"]').trigger('click');
        // Switch on Conflict

        // Clear existing drawings
        conflictSearch.clearDrawing();
        // Add layer from Search
        conflictSearch.addDrawing(layerGroupMouseOver._layers[Object.keys(layerGroupMouseOver._layers)[0]]);
        // Run Conflict
        conflictSearch.makeSearch("Fra Røland dl._fabrik");
    }

    render() {
        return (
            <button className="btn btn-raised" onClick={this.makeSearch}>Konfliktsøgning <i className="material-icons">arrow_forward</i>
            </button>
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

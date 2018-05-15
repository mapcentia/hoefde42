'use strict';

/**
 * @type {*|exports|module.exports}
 */
var React = require('react');
;

var ReactDOM = require('react-dom');


var cloud;

var layerGroup = L.layerGroup();

var utils;

var mapObj;

var exId = "hoefde42Search";

var config = require('../../../../config/config.js');

var mainSearch;

var items = {};


class SearchItem extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let liStyle = {
            padding: '4px 16px'
        };
        return <a style={liStyle} id={this.props.searcher + ':' + this.props.value} href="#"
                  className="list-group-item">
            {this.props.value}
        </a>;
    }


}

module.exports = {
    set: function (o) {
        cloud = o.cloud;
        utils = o.utils;
        mapObj = cloud.get().map;
        mainSearch = o.extensions.vidisearch.index;

    },

    init: function () {
        let me = this;
        mainSearch.registerSearcher({
            key: 'Høfde 42',
            obj: {'searcher': this, 'title': 'Høfde 42'}
        });
    },


    search: function (searchTerm) {
        let url = 'http://rm.mapcentia.com/api/v2/elasticsearch/search/roenland_gl_fabrik/hoefde42/areas_join';
        let query = {
            "_source": {
                "excludes": [
                    "properties.text"
                ]
            },
            "size": 100,
            "query": {
                "bool": {
                    "should": [
                        {
                            "match": {
                                "properties.text": searchTerm
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


        }

        return new Promise(function (resolve, reject) {
            $.post(url, JSON.stringify(query), function (data) {
                let res = data.hits.hits.map((item) => {
                    let it = item['_source']['properties'];
                    items[it.gid] = item['_source'];
                    return {'title': it.links, 'id': it.gid};
                });
                resolve(res);
            }, 'json');
        });
    },

    handleSearch: function (searchTerm) {
        console.log(searchTerm);


        return new Promise(function (resolve, reject) {

            let geom = items[searchTerm].geometry;
            console.log(geom);
            let properties = items[searchTerm].properties;
            let layer = L.geoJson(geom, {
                "color": "blue",
                "weight": 1,
                "opacity": 1,
                "fillOpacity": 0.1,
                "dashArray": '5,3'
            });

            layerGroup.clearLayers();
            console.log(layer);
            layerGroup.addLayer(layer).addTo(mapObj);
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
            </div>;
            resolve(comp);
        });
    }
};

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
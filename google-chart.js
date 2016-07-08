/*!
Copyright 2015 ManyWho, Inc.
Licensed under the ManyWho License, Version 1.0 (the "License"); you may not use this
file except in compliance with the License.
You may obtain a copy of the License at: http://manywho.com/sharedsource
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the specific language governing
permissions and limitations under the License.
*/

(function (manywho) {

    function parseBoolean(value) {

        if (value == true || value == false) {
            return value;
        }

        if (value != null &&
            value.toLowerCase() == 'true') {
            return true;
        }

        return false;

    }

    function convertToGoogleType(contentType) {

        var googleType = 'string';

        if (contentType != null) {

            contentType = contentType.toUpperCase();

            if (contentType == manywho.component.contentTypes.number) {
                googleType = 'number';
            }
        }

        return googleType;

    }

    function getDisplayColumns(columns, outcomes) {

        var displayColumns = manywho.component.getDisplayColumns(columns) || [];

        if (outcomes.filter(function (outcome) {

            return !outcome.isBulkAction;

        }).length > 0) {

            displayColumns.unshift('mw-outcomes');

        }

        return displayColumns;

    }

    function areBulkActionsDefined(outcomes) {

        return outcomes.filter(function (outcome) {

            return outcome.isBulkAction;

        }).length != 0

    }

    function renderHeader(searchValue, outcomes, flowKey, isSearchEnabled, onSearchChanged, onSearchEntered, search, isObjectData, refresh, isDesignTime, model) {

        var lookUpKey = manywho.utils.getLookUpKey(flowKey);
        var headerElements = [];
        var searchElement = null;
        var outcomesElement = null;
        var refreshElement = null;
        var mainElement = document.getElementById(lookUpKey);

        if ((isObjectData &&
             model.attributes != null &&
             parseBoolean(model.attributes.enableRefresh) == true) ||
            (isObjectData &&
             model.attributes == null)) {

            var refreshAttributes = { className: 'btn btn-sm btn-default table-refresh', onClick: refresh };

            if (isDesignTime)
                refreshAttributes.disabled = 'disabled';

            refreshElement = React.DOM.button(refreshAttributes,
                React.DOM.span({ className: 'glyphicon glyphicon-refresh' }, null)
            );

        }

        if (isSearchEnabled) {

            var buttonAttributes = { className: 'btn btn-default', onClick: search };

            if (isDesignTime)
                buttonAttributes.disabled = 'disabled';

            searchElement = React.DOM.div({ className: 'input-group table-search' }, [
                    React.DOM.input({ type: 'text', className: 'form-control', value: searchValue, placeholder: 'Search', onChange: onSearchChanged, onKeyUp: onSearchEntered }),
                    React.DOM.span({ className: 'input-group-btn' },
                        React.DOM.button(buttonAttributes,
                            React.DOM.span({ className: 'glyphicon glyphicon-search' }, null)
                        )
                    )
            ]);

        }

        if (outcomes) {

            outcomesElement =  React.DOM.div({ className: 'table-outcomes' }, outcomes.map(function (outcome) {

                return React.createElement(manywho.component.getByName('outcome'), { id: outcome.id, flowKey: flowKey });

            }));

        }

        if (mainElement && mainElement.clientWidth < 768) {

            headerElements = [outcomesElement, searchElement, refreshElement];

        }
        else {

            headerElements = [refreshElement, searchElement, outcomesElement];

        }

        if (headerElements.length > 0) {

            return React.DOM.div({ className: 'table-header clearfix' }, headerElements);

        }

        return null;

    }

    function renderFooter(pageIndex, hasMoreResults, onNext, onPrev, isDesignTime) {

        var footerElements = [];

        if (pageIndex > 1 || hasMoreResults) {

            footerElements.push(React.createElement(manywho.component.getByName('pagination'),
                {
                    pageIndex: pageIndex,
                    hasMoreResults: hasMoreResults,
                    containerClasses: 'pull-right',
                    onNext: onNext,
                    onPrev: onPrev,
                    isDesignTime: isDesignTime
                }
            ));

        }

        if (footerElements.length > 0) {

            return React.DOM.div({ className: 'table-footer clearfix' }, footerElements);

        }

        return null;

    }

    var googleChart = React.createClass({

        outcomes: null,

        onSearchChanged: function (e) {

            if (this.props.isDesignTime)
                return;

            manywho.state.setComponent(this.props.id, { search: e.target.value }, this.props.flowKey, true);

            this.forceUpdate();

        },

        onSearchEnter: function (e) {

            if (e.keyCode == 13 && !this.props.isDesignTime) {

                e.stopPropagation();
                this.search();

            }

        },

        renderRows: function (objectData, outcomes, displayColumns) {

            var model = manywho.model.getComponent(this.props.id, this.props.flowKey);
            var outcomeComponent = manywho.component.getByName('outcome');

            var chartId = this.props.id;

            // Set a callback to run when the Google Visualization API is loaded.
            google.charts.setOnLoadCallback(function() {

                // Create the data table.
                var data = new google.visualization.DataTable();

                if (displayColumns != null &&
                    displayColumns.length > 0) {

                    for (var i = 0; i < displayColumns.length; i++) {

                        data.addColumn(convertToGoogleType(displayColumns[i].contentType), displayColumns[i].label);

                    }

                }

                if (objectData != null &&
                    objectData.length > 0) {

                    var rows = [];

                    for (var i = 0; i < objectData.length; i++) {

                        if (objectData[i].properties != null &&
                            objectData[i].properties.length > 0 &&
                            displayColumns != null &&
                            displayColumns.length > 0) {

                            var row = [];

                            for (var k = 0; k < displayColumns.length; k++) {

                                for (var j = 0; j < objectData[i].properties.length; j++) {

                                    if (objectData[i].properties[j].typeElementPropertyId == displayColumns[k].typeElementPropertyId) {

                                        if (convertToGoogleType(displayColumns[k].contentType) == 'number') {
                                            var number = parseFloat(objectData[i].properties[j].contentValue);

                                            if (isNaN(number) == true) {
                                                number = 0;
                                            }

                                            row[row.length] = number;
                                        } else {
                                            row[row.length] = objectData[i].properties[j].contentValue;
                                        }

                                    }

                                }

                            }

                            rows[rows.length] = row;

                        }

                    }

                    data.addRows(rows);

                }

                // Set chart options
                var options = {
                    'width': '100%',
                    'height': '100%'
                };
                var chart = null;

                if (model.attributes) {

                    if (model.attributes.pieHole) {

                        options.pieHole = parseFloat(model.attributes.pieHole);

                    }

                    if (model.attributes.is3D) {

                        options.is3D = parseBoolean(model.attributes.is3D);

                    }

                    if (model.attributes.chart) {

                        if (model.attributes.chart.toLowerCase() == 'annotation') {
                            chart = new google.visualization.AnnotationChart(document.getElementById(chartId));
                        } else if (model.attributes.chart.toLowerCase() == 'area') {
                            chart = new google.visualization.AreaChart(document.getElementById(chartId));
                        } else if (model.attributes.chart.toLowerCase() == 'bar') {
                            chart = new google.visualization.BarChart(document.getElementById(chartId));
                        } else if (model.attributes.chart.toLowerCase() == 'bubble') {
                            chart = new google.visualization.BubbleChart(document.getElementById(chartId));
                        } else if (model.attributes.chart.toLowerCase() == 'calendar') {
                            chart = new google.visualization.Calendar(document.getElementById(chartId));
                        } else if (model.attributes.chart.toLowerCase() == 'candlestick') {
                            chart = new google.visualization.CandlestickChart(document.getElementById(chartId));
                        } else if (model.attributes.chart.toLowerCase() == 'column') {
                            chart = new google.visualization.ColumnChart(document.getElementById(chartId));
                        } else if (model.attributes.chart.toLowerCase() == 'gauge') {
                            chart = new google.visualization.Gauge(document.getElementById(chartId));
                        } else if (model.attributes.chart.toLowerCase() == 'line') {
                            chart = new google.visualization.LineChart(document.getElementById(chartId));
                        } else if (model.attributes.chart.toLowerCase() == 'sankey') {
                            chart = new google.visualization.Sankey(document.getElementById(chartId));
                        } else if (model.attributes.chart.toLowerCase() == 'treemap') {
                            chart = new google.visualization.TreeMap(document.getElementById(chartId));
                        }

                    }

                }

                if (chart == null) {

                    chart = new google.visualization.PieChart(document.getElementById(chartId));

                }

                chart.draw(data, options);

            });

            return React.DOM.div({ id: this.props.id }, null);

        },

        search: function () {

            if (this.props.isDesignTime)
                return;

            var model = manywho.model.getComponent(this.props.id, this.props.flowKey);
            var state = manywho.state.getComponent(this.props.id, this.props.flowKey);

            this.clearSelection();

            if (model.objectDataRequest) {

                manywho.engine.objectDataRequest(this.props.id, model.objectDataRequest, this.props.flowKey, manywho.settings.global('paging.table'), state.search, null, null, state.page);

            }
            else {

                var displayColumns = (manywho.component.getDisplayColumns(model.columns) || []).map(function(column) {

                    return column.typeElementPropertyId.toLowerCase();

                });

                this.setState({
                    objectData: model.objectData.filter(function(objectData) {

                        return objectData.properties.filter(function(property) {

                            return displayColumns.indexOf(property.typeElementPropertyId) != -1 && property.contentValue.toLowerCase().indexOf(state.search.toLowerCase()) != -1

                        }).length > 0

                    })
                });

                state.page = 1;
                manywho.state.setComponent(this.props.id, state, this.props.flowKey, true);

            }

        },

        refresh: function () {

            if (this.props.isDesignTime)
                return;

            manywho.state.setComponent(this.props.id, { search: '' }, this.props.flowKey, true);

            this.search();

        },

        onRowClicked: function (e) {

            var selectedRows = this.state.selectedRows;

            var model = manywho.model.getComponent(this.props.id, this.props.flowKey);

            if (selectedRows.indexOf(e.currentTarget.id) == -1) {

                model.isMultiSelect ? selectedRows.push(e.currentTarget.id) : selectedRows = [e.currentTarget.id];

            }
            else {

                selectedRows.splice(selectedRows.indexOf(e.currentTarget.id), 1);

            }

            this.setState({ selectedRows: selectedRows });
            manywho.state.setComponent(this.props.id, { objectData: manywho.component.getSelectedRows(model, selectedRows) }, this.props.flowKey, true);

        },

        clearSelection: function () {

            this.setState({ selectedRows: [] });
            manywho.state.setComponent(this.props.id, { objectData: [] }, this.props.flowKey, true);

        },

        onOutcome: function (objectDataId, outcomeId) {

            var model = manywho.model.getComponent(this.props.id, this.props.flowKey);
            manywho.state.setComponent(model.id, { objectData: manywho.component.getSelectedRows(model, [objectDataId]) }, this.props.flowKey, true);

            var flowKey = this.props.flowKey;
            var outcome = manywho.model.getOutcome(outcomeId, this.props.flowKey);
            manywho.engine.move(outcome, this.props.flowKey)
                .then(function() {

                    if (outcome.isOut) {

                        manywho.engine.flowOut(outcome, flowKey);

                    }

                });

        },

        onNext: function() {

            var model = manywho.model.getComponent(this.props.id, this.props.flowKey);
            var state = manywho.state.getComponent(this.props.id, this.props.flowKey);

            if (!state.page) {

                state.page = 1;

            }

            state.page++;
            manywho.state.setComponent(this.props.id, state, this.props.flowKey, true);

            if (model.objectDataRequest || model.fileDataRequest)
                this.search();
            else if (model.attributes.pagination && manywho.utils.isEqual(model.attributes.pagination, 'true', true)) {
                this.forceUpdate();
            }

        },

        onPrev: function() {

            var model = manywho.model.getComponent(this.props.id, this.props.flowKey);
            var state = manywho.state.getComponent(this.props.id, this.props.flowKey);
            state.page--;

            manywho.state.setComponent(this.props.id, state, this.props.flowKey, true);

            if (model.objectDataRequest || model.fileDataRequest)
                this.search();
            else if (model.attributes.pagination && manywho.utils.isEqual(model.attributes.pagination, 'true', true)) {
                this.forceUpdate();
            }

        },

        getInitialState: function () {

            return {
                selectedRows: [],
                windowWidth: window.innerWidth,
                sortByOrder: 'ASC',
                lastOrderBy: '',
                objectData: null
            }

        },

        componentDidMount: function () {

            if (googleChartsLoaded == false) {
                // Load the Visualization API and the corechart package.
                google.charts.load('current', {'packages':['corechart']});
                googleChartsLoaded = true;
            }

        },

        componentWillUnmount: function () {


        },

        componentWillMount: function() {

            var model = manywho.model.getComponent(this.props.id, this.props.flowKey);
            if (!model.objectDataRequest) {

                this.setState({ objectData: model.objectData });

            }

        },

        componentWillReceiveProps: function(nextProps) {

            var model = manywho.model.getComponent(nextProps.id, nextProps.flowKey);
            var state = this.props.isDesignTime ? { error: null, loading: false } : manywho.state.getComponent(this.props.id, this.props.flowKey) || {};

            if (!model.objectDataRequest && !model.fileDataRequest && manywho.utils.isNullOrWhitespace(state.search) && (manywho.utils.isNullOrWhitespace(state.page) || state.page == 1)) {

                this.setState({ objectData: model.objectData });

            }

        },

        render: function () {

            manywho.log.info('Rendering Google Chart: ' + this.props.id);

            var model = manywho.model.getComponent(this.props.id, this.props.flowKey);
            var state = this.props.isDesignTime ? { error: null, loading: false } : manywho.state.getComponent(this.props.id, this.props.flowKey) || {};

            this.outcomes = manywho.model.getOutcomes(this.props.id, this.props.flowKey);

            var objectData = this.props.isDesignTime ? [] : model.objectData;

            if (model.objectData && state.objectData && !this.state.objectData) {

                objectData = model.objectData.map(function (modelItem) {

                    var stateObjectData = state.objectData.filter(function (stateItem) {

                        return manywho.utils.isEqual(modelItem.externalId, stateItem.externalId) && manywho.utils.isEqual(modelItem.internalId, stateItem.internalId);

                    })[0];

                    if (stateObjectData) {

                        return manywho.utils.extend({}, [modelItem, stateObjectData]);

                    }
                    else {

                        return modelItem;

                    }

                });

            }

            var displayColumns = (this.props.isDesignTime) ? [] : getDisplayColumns(model.columns, this.outcomes);
            var hasMoreResults = (model.objectDataRequest && model.objectDataRequest.hasMoreResults) || (model.fileDataRequest && model.fileDataRequest.hasMoreResults);
            var content = null;
            var rowOutcomes = this.outcomes.filter(function (outcome) { return !outcome.isBulkAction });
            var headerOutcomes = this.outcomes.filter(function (outcome) { return outcome.isBulkAction });

            if (this.state.objectData)
            {
                objectData = this.state.objectData;
            }

            if (state.error) {

                content = React.DOM.div({ className: 'table-error' }, [
                    React.DOM.p({ className: 'lead' }, state.error.message),
                    React.DOM.button({ className: 'btn btn-danger', onClick: this.search }, 'Retry')
                ]);

            }
            else if (displayColumns.length == 0) {

                content = React.DOM.div({ className: 'table-error' },
                    React.DOM.p({ className: 'lead' }, 'No display columns have been defined for this table')
                );

            }
            else {

                content = this.renderRows(objectData || [], rowOutcomes, displayColumns);

            }

            var classNames = [];

            if (model.isVisible == false)
                classNames.push('hidden');

            classNames = classNames.concat(manywho.styling.getClasses(this.props.parentId, this.props.id, "google-chart", this.props.flowKey));

            if (model.attributes && model.attributes.classes) {

                classNames = classNames.join(' ') + ' ' + model.attributes.classes;

            }
            else {

                classNames = classNames.join(' ');

            }

            var validationElement = null;
            if (typeof model.isValid !== 'undefined' && model.isValid == false) {

                validationElement = React.DOM.div({ className: 'has-error' }, React.DOM.span({ className: 'help-block' }, model.validationMessage));

            }

            if (model.isVisible == false) {
                classNames += ' hidden';
            }

            return React.DOM.div({ className: classNames }, [
                React.DOM.div({ className: 'panel panel-default' }, [
                    React.DOM.div({ className: 'panel-heading' }, model.label),
                    React.DOM.div({ className: 'panel-body' }, [ validationElement,
                        React.DOM.div(null, [
                            renderHeader(state.search, headerOutcomes, this.props.flowKey, model.isSearchable, this.onSearchChanged, this.onSearchEnter, this.search, (model.objectDataRequest || model.fileDataRequest), this.refresh, this.props.isDesignTime, model),
                            content,
                            renderFooter(state.page || 1, hasMoreResults, this.onNext, this.onPrev, this.props.isDesignTime),
                            React.createElement(manywho.component.getByName('wait'), { isVisible: state.loading, message: state.loading && state.loading.message, isSmall: true }, null)
                        ])
                    ])
                ])
            ]);

        }

    });

    manywho.component.register("google-chart", googleChart, ['google_chart']);

}(manywho));

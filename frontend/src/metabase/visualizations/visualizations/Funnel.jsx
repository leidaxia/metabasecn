/* @flow */

import React, { Component } from "react";

import { MinRowsError, ChartSettingsError } from "metabase/visualizations/lib/errors";

import { formatValue } from "metabase/lib/formatting";

import { getSettings, metricSetting, dimensionSetting } from "metabase/visualizations/lib/settings";

import FunnelNormal from "../components/FunnelNormal";
import FunnelBar from "../components/FunnelBar";
import LegendHeader from "../components/LegendHeader";

import _ from "underscore";
import cx from "classnames";

import type { VisualizationProps } from "metabase/meta/types/Visualization";

export default class Funnel extends Component {
    props: VisualizationProps;

    static uiName = "漏斗图";
    static identifier = "funnel";
    static iconName = "funnel";

    static noHeader = true;

    static minSize = {
        width: 5,
        height: 4
    };

    static isSensible(cols, rows) {
        return cols.length === 2;
    }

    static checkRenderable(series, settings) {
        const [{ data: { rows} }] = series;
        if (series.length > 1) {
            return;
        }

        if (rows.length < 1) {
            throw new MinRowsError(1, rows.length);
        }
        if (!settings["funnel.dimension"] || !settings["funnel.metric"]) {
            throw new ChartSettingsError("那些字段需要使用到", "Data", "选择字段");
        }
    }

    static settings = {
        "funnel.dimension": {
            section: "Data",
            title: "步",
            ...dimensionSetting("funnel.dimension"),
            dashboard: false,
            useRawSeries: true,
        },
        "funnel.metric": {
            section: "Data",
            title: "Measure",
            ...metricSetting("funnel.metric"),
            dashboard: false,
            useRawSeries: true,
        },
        "funnel.type": {
            title: "漏斗图类型",
            section: "Display",
            widget: "select",
            props: {
                options: [{ name: "Funnel", value: "funnel"}, { name: "Bar chart", value: "bar"}]
            },
            // legacy "bar" funnel was only previously available via multiseries
            getDefault: (series) => series.length > 1 ? "bar" : "funnel",
            useRawSeries: true
        },
    }

    static transformSeries(series) {
        let [{ card, data: { rows, cols }}] = series;

        const settings = getSettings(series);

        const dimensionIndex = _.findIndex(cols, (col) => col.name === settings["funnel.dimension"]);
        const metricIndex = _.findIndex(cols, (col) => col.name === settings["funnel.metric"]);

        if (!card._transformed &&
            series.length === 1 && rows.length > 1 &&
            dimensionIndex >= 0 && metricIndex >= 0
        ) {
            return rows.map(row => ({
                card: {
                    ...card,
                    name: formatValue(row[dimensionIndex], { column: cols[dimensionIndex] }),
                    _transformed: true
                },
                data: {
                    rows: [[row[dimensionIndex], row[metricIndex]]],
                    cols: [cols[dimensionIndex], cols[metricIndex]]
                }
            }));
        } else {
            return series;
        }
    }

    render() {
        const { settings } = this.props;

        if (settings["funnel.type"] === "bar") {
            return <FunnelBar {...this.props} />
        } else {
            const { actionButtons, className, onChangeCardAndRun, series } = this.props;
            return (
                <div className={cx(className, "flex flex-column p1")}>
                    <LegendHeader
                        className="flex-no-shrink"
                        // $FlowFixMe
                        series={series._raw || series}
                        actionButtons={actionButtons}
                        onChangeCardAndRun={onChangeCardAndRun}
                    />
                    <FunnelNormal {...this.props} className="flex-full" />
                </div>
            )
        }
    }
}

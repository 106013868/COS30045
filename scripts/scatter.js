// Healthcare spending vs life expectancy
function scatterPlot() {
    // chart properties
    let w = 800;
    let h = 500;
    let padding = 60;
    let year = 2022;

    // Clicked Country Code
    let selectedCode = null;

    let dataset;

    // load the data and convert the numeric columns
    d3.csv("data/health_data.csv", function(d) {
        return {
            country: d.country,
            code: d.code,
            region: d.region,
            year: +d.year,
            spending: +d.spending,
            lifeExpectancy: +d.life_expectancy
        };
    }).then(function(data) {
        dataset = data;

        drawChart(dataset);
    });

    function drawChart(dataset) {
        let xScale = d3.scaleLinear()
            .domain([0, d3.max(dataset, function(d) {
                return d.spending;
            })])
            .range([padding, w - padding])
            .nice();

        let yScale = d3.scaleLinear()
            .domain([d3.min(dataset, function(d) {
                return d.lifeExpectancy;
            }) - 2, d3.max(dataset, function(d) {
                return d.lifeExpectancy;
            }) + 1])
            .range([h - padding, padding])
            .nice();

        let fullX = xScale.domain();
        let fullY = yScale.domain();

        let xAxis = d3.axisBottom()
            .ticks(8)
            .scale(xScale);

        let yAxis = d3.axisLeft()
            .ticks(8)
            .scale(yScale);

        let svg = d3.select("#chart")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

        svg.on("click", function() {
            if (selectedCode !== null) {
                selectCountry(null);
            }
        });

        let xAxisG = svg.append("g")
            .attr("transform", "translate(0," + (h - padding) + ")")
            .call(xAxis);

        let yAxisG = svg.append("g")
            .attr("transform", "translate(" + padding + ",0)")
            .call(yAxis);

        // axis titles
        svg.append("text")
            .attr("x", w / 2)
            .attr("y", h - 15)
            .attr("text-anchor", "middle")
            .attr("font-size", "13px")
            .text("Healthcare spending per person (USD PPP)");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -h / 2)
            .attr("y", 18)
            .attr("text-anchor", "middle")
            .attr("font-size", "13px")
            .text("Life expectancy at birth (years)");


        // average lines, added before the circles so they sit behind them
        // they start on the axes and slide to the averages on first load
        let avgX = svg.append("line")
            .attr("class", "avg")
            .attr("x1", padding)
            .attr("x2", padding)
            .attr("y1", padding)
            .attr("y2", h - padding)
            .attr("stroke", "grey")
            .attr("stroke-dasharray", "4 4");

        let avgY = svg.append("line")
            .attr("class", "avg")
            .attr("x1", padding)
            .attr("x2", w - padding)
            .attr("y1", h - padding)
            .attr("y2", h - padding)
            .attr("stroke", "grey")
            .attr("stroke-dasharray", "4 4");

        let avgXLabel = svg.append("text")
            .attr("class", "avg")
            .attr("x", padding)
            .attr("y", padding - 8)
            .attr("font-size", "11px")
            .attr("fill", "grey");

        let avgYLabel = svg.append("text")
            .attr("class", "avg")
            .attr("x", w - padding)
            .attr("y", h - padding)
            .attr("text-anchor", "end")
            .attr("font-size", "11px")
            .attr("fill", "grey");

        let avgSpending = null;
        let avgLife = null;
        let clipMargin = 8;

        svg.append("defs")
            .append("clipPath")
            .attr("id", "plotClip")
            .append("rect")
            .attr("x", padding - clipMargin)
            .attr("y", padding - clipMargin)
            .attr("width", w - padding * 2 + clipMargin * 2)
            .attr("height", h - padding * 2 + clipMargin * 2);

        let plot = svg.append("g")
            .attr("clip-path", "url(#plotClip)");

        let allTrail = plot.append("g")
            .attr("class", "all-trails");

        let trail = plot.append("g")
            .attr("class", "trail");

        // Turns A Country's Yearly Rows Into A Line
        let lineGen = d3.line()
            .x(function(d) {
                return xScale(d.spending);
            })
            .y(function(d) {
                return yScale(d.lifeExpectancy);
            });

        let showAll = false;

        function trailColour(d) {
            return d.code === "AUS" ? "orangered" : "#1d6fa5";
        }

        function trailWidth(d) {
            return d.code === "AUS" ? 2 : 1.2;
        }

        function trailOpacity(d) {
            return d.code === "AUS" ? 0.9 : 0.4;
        }

        // Draw Trail Lines
        function updateAllTrails() {
            if (!showAll) {
                return;
            }

            let regions = selectedRegions();

            let groups = d3.groups(
                dataset.filter(function(d) {
                    return regions.includes(d.region);
                }),
                function(d) {
                    return d.code;
                }
            ).map(function(g) {
                return {
                    code: g[0],
                    rows: g[1].sort(function(a, b) {
                        return a.year - b.year;
                    })
                };
            });

            let paths = allTrail.selectAll("path")
                .data(groups, function(d) {
                    return d.code;
                });

            paths.exit().remove();

            let entered = paths.enter()
                .append("path")
                .attr("fill", "none")
                .attr("opacity", 0)
                .style("pointer-events", "none");

            entered.transition("fade")
                .duration(400)
                .attr("opacity", 1);

            entered.merge(paths)
                .attr("d", function(d) {
                    return lineGen(d.rows);
                })
                .attr("stroke", trailColour)
                .attr("stroke-width", trailWidth)
                .attr("stroke-opacity", trailOpacity);
        }

        // Fade The Faint Lines Out
        function hideAllTrails() {
            allTrail.selectAll("path")
                .transition("fade")
                .duration(300)
                .attr("opacity", 0)
                .remove();
        }

        // Sort Year Data
        function getHistory(code) {
            return dataset
                .filter(function(d) {
                    return d.code === code;
                })
                .sort(function(a, b) {
                    return a.year - b.year;
                });
        }

        // Draws The Dot Trail Behind The Clicked Countries
        function drawTrail() {
            trail.selectAll("*").remove();

            if (selectedCode === null) {
                return;
            }

            let history = getHistory(selectedCode);

            if (history.length < 2) {
                return;
            }

            let path = trail.append("path")
                .datum(history)
                .attr("d", lineGen)
                .attr("fill", "none")
                .attr("stroke", "#444")
                .attr("stroke-width", 2)
                .attr("stroke-opacity", 0.7)
                .style("pointer-events", "none");

            // Animate Draw Line
            let length = path.node().getTotalLength();
            let drawTime = 800;

            path.attr("stroke-dasharray", length + " " + length)
                .attr("stroke-dashoffset", length)
                .transition()
                .duration(drawTime)
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0);

            // Dot All
            trail.selectAll("circle")
                .data(history)
                .enter()
                .append("circle")
                .attr("class", "trail-dot")
                .attr("cx", function(d) {
                    return xScale(d.spending);
                })
                .attr("cy", function(d) {
                    return yScale(d.lifeExpectancy);
                })
                .attr("r", 3.5)
                .attr("fill", "white")
                .attr("stroke", "#444")
                .attr("stroke-width", 1.5)
                .attr("opacity", 0)
                .on("click", function(event) {
                    event.stopPropagation();
                })
                .on("mouseover", function(event, d) {
                    d3.select("#tooltip")
                        .style("display", "block")
                        .html("<strong>" + d.country + " (" + d.year + ")</strong><br>" +
                            "Spending: $" + d.spending.toLocaleString() + "<br>" +
                            "Life expectancy: " + d.lifeExpectancy + " years");
                })
                .on("mousemove", function(event) {
                    d3.select("#tooltip")
                        .style("left", (event.pageX + 12) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    d3.select("#tooltip").style("display", "none");
                })
                .transition()
                .delay(function(d, i) {
                    return i * (drawTime / history.length);
                })
                .duration(200)
                .attr("opacity", 1);

            // First Year (2011 Usually)
            trail.selectAll("text")
                .data([history[0], history[history.length - 1]])
                .enter()
                .append("text")
                .attr("class", "trail-label")
                .attr("x", function(d) {
                    return xScale(d.spending) + 8;
                })
                .attr("y", function(d) {
                    return yScale(d.lifeExpectancy) - 8;
                })
                .attr("font-size", "11px")
                .attr("font-weight", "bold")
                .attr("fill", "#444")
                .style("pointer-events", "none")
                .text(function(d) {
                    return d.year;
                });
        }

        function updateHighlight() {
            svg.selectAll("circle.point")
                .attr("stroke", function(d) {
                    return d.code === selectedCode ? "#111" : "none";
                })
                .attr("stroke-width", 2);
        }

        function selectCountry(code) {
            selectedCode = code;

            // Line Redraw
            trail.selectAll("*").remove();
            updateHighlight();

            if (code === null) {
                zoomTo(fullX, fullY);
                return;
            }

            let history = getHistory(code);

            zoomTo(
                paddedExtent(history.map(function(d) { return d.spending; }), fullX),
                paddedExtent(history.map(function(d) { return d.lifeExpectancy; }), fullY),
                function() {
                    if (selectedCode === code) {
                        drawTrail();
                    }
                }
            );
        }

        // Dynamic Pad For Things
        function paddedExtent(values, full) {
            let lo = d3.min(values);
            let hi = d3.max(values);
            let span = Math.max(hi - lo, (full[1] - full[0]) * 0.08);
            let mid = (lo + hi) / 2;
            let half = span * (0.5 + 0.15);

            return [Math.max(full[0], mid - half), Math.min(full[1], mid + half)];
        }

        // Animate
        function zoomTo(xDomain, yDomain, onEnd) {
            // Stop Movements
            svg.selectAll("circle.point, .avg, text.label").interrupt();

            let ix = d3.interpolate(xScale.domain(), xDomain);
            let iy = d3.interpolate(yScale.domain(), yDomain);

            svg.transition("zoom")
                .duration(750)
                .ease(d3.easeCubicInOut)
                .tween("zoom", function() {
                    return function(t) {
                        xScale.domain(ix(t));
                        yScale.domain(iy(t));
                        redraw();
                    };
                })
                .on("end", function() {
                    if (onEnd) {
                        onEnd();
                    }
                });
        }

        // Reposition
        function redraw() {
            xAxisG.call(xAxis);
            yAxisG.call(yAxis);

            plot.selectAll("circle.point")
                .attr("cx", function(d) {
                    return xScale(d.spending);
                })
                .attr("cy", function(d) {
                    return yScale(d.lifeExpectancy);
                });

            plot.selectAll("text.label")
                .attr("x", function(d) {
                    return xScale(d.spending) + 12;
                })
                .attr("y", function(d) {
                    return yScale(d.lifeExpectancy) + 4;
                });

            allTrail.selectAll("path")
                .attr("d", function(d) {
                    return lineGen(d.rows);
                });

            if (avgSpending !== null) {
                avgX.attr("x1", xScale(avgSpending))
                    .attr("x2", xScale(avgSpending));
                avgXLabel.attr("x", xScale(avgSpending) + 5);

                avgY.attr("y1", yScale(avgLife))
                    .attr("y2", yScale(avgLife));
                avgYLabel.attr("y", yScale(avgLife) - 5);
            }

            updateAvgVisibility();
        }

        // Hide Average Lines When Outside
        function updateAvgVisibility() {
            let xIn = false;
            let yIn = false;

            if (avgSpending !== null) {
                xIn = xScale(avgSpending) >= padding && xScale(avgSpending) <= w - padding;
                yIn = yScale(avgLife) >= padding && yScale(avgLife) <= h - padding;
            }

            avgX.style(     "display", xIn ? null : "none");
            avgXLabel.style("display", xIn ? null : "none");
            avgY.style(     "display", yIn ? null : "none");
            avgYLabel.style("display", yIn ? null : "none");
        }

        function selectedRegions() {
            let regions = [];

            d3.selectAll(".regionBox").each(function() {
                if (this.checked) {
                    regions.push(this.value);
                }
            });

            return regions;
        }

        function updateChart(year) {
            let regions = selectedRegions();

            // Clear Selection On Unclick
            if (selectedCode !== null) {
                let selected = dataset.find(function(d) {
                    return d.code === selectedCode;
                });

                if (!selected || !regions.includes(selected.region)) {
                    selectCountry(null);
                }
            }

            let yearData = dataset.filter(function(d) {
                return d.year === year && regions.includes(d.region);
            });

            // averages of the countries currently shown
            let meanSpending = d3.mean(yearData, function(d) {
                return d.spending;
            });

            let meanLife = d3.mean(yearData, function(d) {
                return d.lifeExpectancy;
            });

            // hide the averages if every region is unticked
            if (yearData.length > 0) {
                avgSpending = meanSpending;
                avgLife = meanLife;
            } else {
                avgSpending = null;
                avgLife = null;
            }

            updateAvgVisibility();

            if (yearData.length > 0) {
                avgX.transition()
                    .duration(500)
                    .attr("x1", xScale(meanSpending))
                    .attr("x2", xScale(meanSpending));

                avgY.transition()
                    .duration(500)
                    .attr("y1", yScale(meanLife))
                    .attr("y2", yScale(meanLife));

                avgXLabel.text("Average: $" + Math.round(meanSpending).toLocaleString())
                    .transition()
                    .duration(500)
                    .attr("x", xScale(meanSpending) + 5);

                avgYLabel.text("Average: " + meanLife.toFixed(1) + " years")
                    .transition()
                    .duration(500)
                    .attr("y", yScale(meanLife) - 5);
            }

            // key by country code so each circle stays with the same country across years
            let circles = plot.selectAll("circle.point")
                .data(yearData, function(d) {
                    return d.code;
                });

            // remove countries with no data for this year
            circles.exit().remove();

            let circlesEnter = circles.enter()
                .append("circle")
                .attr("class", "point")
                .style("cursor", "pointer")
                .attr("r", function(d) {
                    if (d.code === "AUS") {
                        return 7;
                    } else {
                        return 5;
                    }
                })
                .attr("fill", pointColour)
                .attr("cx", function(d) {
                    return xScale(d.spending);
                })
                .attr("cy", function(d) {
                    return yScale(d.lifeExpectancy)
                })
                .on("click", function(event, d) {
                    // Stop SVG Events
                    event.stopPropagation();

                    if (selectedCode === d.code) {
                        selectCountry(null);    // Reset On Same Code
                    } else {
                        selectCountry(d.code);  // Go To THe Other Country
                    }
                })
                .on("mouseover", function(event, d) {
                    // fill the tooltip with this country's values and show it
                    d3.select("#tooltip")
                        .style("display", "block")
                        .html("<strong>" + d.country + "</strong><br>" +
                            d.region + "<br>" +
                            "Spending: $" + d.spending.toLocaleString() + "<br>" +
                            "Life expectancy: " + d.lifeExpectancy + " years");

                    // bring the hovered dot in front of any it overlaps
                    d3.select(this).raise();
                    d3.select(this)
                        .transition("hover")
                        .duration(200)
                        .attr("fill", "orange")
                        .attr("opacity", 1);

                    // Hide Other Dots
                    let hovered = this;
                    plot.selectAll("circle.point")
                        .filter(function(p) {
                            return this !== hovered && p.code !== selectedCode;
                        })
                        .transition("hover")
                        .duration(200)
                        .attr("fill", function(p) {
                            return d3.color(pointColour(p)).darker(1);
                        })
                        .attr("opacity", 0.35);

                    // Highlight The Country Trail
                    let hoveredCode = d.code;

                    allTrail.selectAll("path")
                        .filter(function(p) {
                            return p.code === hoveredCode;
                        })
                        .raise()
                        .transition("hover")
                        .duration(200)
                        .attr("stroke", "orange")
                        .attr("stroke-width", 4)
                        .attr("stroke-opacity", 1);

                    allTrail.selectAll("path")
                        .filter(function(p) {
                            return p.code !== hoveredCode;
                        })
                        .transition("hover")
                        .duration(200)
                        .attr("stroke-opacity", 0.12);

                    // Big Selected Country's Trail
                    if (d.code === selectedCode) {
                        trail.selectAll("path")
                            .transition("hover")
                            .duration(200)
                            .attr("stroke-width", 4)
                            .attr("stroke-opacity", 1);
                    }
                })
                .on("mousemove", function(event) {
                    d3.select("#tooltip")
                        .style("left", (event.pageX + 12) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    d3.select("#tooltip").style("display", "none");

                    // Reset Dots From Highlight
                    plot.selectAll("circle.point")
                        .transition("hover")
                        .duration(200)
                        .attr("fill", pointColour)
                        .attr("opacity", 1);

                    // Reset Trails From Highlight
                    allTrail.selectAll("path")
                        .transition("hover")
                        .duration(200)
                        .attr("stroke", trailColour)
                        .attr("stroke-width", trailWidth)
                        .attr("stroke-opacity", trailOpacity);

                    trail.selectAll("path")
                        .transition("hover")
                        .duration(200)
                        .attr("stroke-width", 2)
                        .attr("stroke-opacity", 0.7);
                });
            circlesEnter.merge(circles)
                .transition()
                .duration(500)
                .attr("cx", function(d) {
                    return xScale(d.spending);
                })
                .attr("cy", function(d) {
                    return yScale(d.lifeExpectancy);
            });

            updateHighlight();
            updateAllTrails();

            let label = plot.selectAll("text.label")
                .data(yearData.filter(function(d) {
                    return d.code === "AUS";
                }));
            
            label.exit().remove();

            label.enter()
                .append("text")
                .attr("class", "label")
                .text(function(d) {
                    return d.country;
                })
                .attr("fill", "orangered")
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .attr("x", function(d) {
                    return xScale(d.spending) + 12;
                })
                .attr("y", function(d) {
                    return yScale(d.lifeExpectancy) + 4;
                })
                .merge(label)
                .transition()
                .duration(500)
                .attr("x", function(d) {
                    return xScale(d.spending) + 12;
                })
                .attr("y", function(d) {
                    return yScale(d.lifeExpectancy) + 4;
            })
        }

        updateChart(year);

        // slider changes the year shown
        d3.select("#yearSlider")
            .style("display", "block")
            .style("width", (w - padding * 2) + "px")
            .style("margin-left", padding + "px")
            .on("input", function() {
                year = +this.value;
                d3.select("#yearLabel").text(year);
                updateChart(year);
            });

        d3.selectAll(".regionBox")
            .on("change", function() {
                updateChart(year);
            });

        // Deselect Any Country  Then Show Every Country's Line
        d3.select("#allTrailsBtn")
            .on("click", function() {
                showAll = !showAll;

                d3.select(this)
                    .text(showAll ? "Hide all history trails" : "Show all history trails")
                    .attr("aria-pressed", showAll);

                if (showAll) {
                    if (selectedCode !== null) {
                        selectCountry(null);
                    }
                    updateAllTrails();
                } else {
                    hideAllTrails();
                }
            });
    }

    // used when drawing circles and when restoring colour after a hover
    function pointColour(d) {
        if (d.code === "AUS") {
            return "orangered";
        } else {
            return "dodgerblue";
        }
    }
}

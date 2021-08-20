import Vue from 'vue';
import * as d3 from 'd3-shape';
import Pins from './Pins.vue';
import { findRightIndex, alignEndsHorizontally,getTransformAlong } from './utils';

function install(editor, { curve = d3.curveCatmullRom.alpha(1), curvature = 0.05,arrow={color:"steelblue",marker:"M-5,-10 L-5,10 L20,0 z"} }) {
    editor.on('connectionpath', data => {
        const { connection } = data;
        const [x1, y1, x2, y2] = data.points;
        const pins = connection && connection.data.pins ? connection.data.pins : [];
        const points = [[x1, y1], ...pins.map(({ x, y }) => [x, y]), [x2, y2]];
        const transformedPoints = alignEndsHorizontally(points, curvature);

        data.d = d3.line()
            .x(d => d[0])
            .y(d => d[1])
            .curve(curve)
            (transformedPoints)
    });
    var  last_active=false

    editor.on('renderconnection', ({ el, connection }) => {
        const path = el.querySelector('.connection path');
        const pins = connection.data.pins || (connection.data.pins = []);
        el.classList.add('bpm-connect-rete')
        if (!path) throw new Error('<path> not found');


        if(connection.data.color){
            path.style.setProperty("stroke", connection.data.color)
        }
        if(connection.data.state_color) {
            path.style.setProperty("stroke", connection.data.state_color)
        }

        path.addEventListener('click', function () {
            if(last_active){
                last_active.classList.remove("select-connection")
            }
            el.classList.add("select-connection")
            editor.last_active_connect=el;
            last_active=el
        })
        connection.addPink=()=>{
            const { mouse } = editor.view.area;
            const pin = { ...mouse };
            const [x1, y1, x2, y2] = editor.view.connections.get(connection).getPoints();
            const points = [{ x: x1, y: y1 }, ...pins, { x: x2, y: y2 }];
            const index = findRightIndex(pin, points);

            pins.splice(index, 0, pin)

            app.$children[0].$forceUpdate();
            editor.view.connections.get(connection).update();
        }
        path.addEventListener('dblclick', () => {
            const { mouse } = editor.view.area;
            const pin = { ...mouse };
            const [x1, y1, x2, y2] = editor.view.connections.get(connection).getPoints();
            const points = [{ x: x1, y: y1 }, ...pins, { x: x2, y: y2 }];
            const index = findRightIndex(pin, points);

            pins.splice(index, 0, pin)

            app.$children[0].$forceUpdate();
            editor.view.connections.get(connection).update();
        });

        const vueContainer = document.createElement('div');

        el.appendChild(vueContainer);

        const app = new Vue({
            provide: {
                editor,
                connection
            },
            render: h => h(Pins, { props: { pins } })
        }).$mount(vueContainer)


    })
    if (arrow) {
        editor.on('renderconnection', ({ el }) => {
            const path = el.querySelector('path');
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'path');

            el.querySelector('svg').appendChild(marker);
            marker.classList.add('marker');
            marker.setAttribute('fill', arrow.color || 'steelblue');
            marker.setAttribute('d', arrow.marker || 'M-5,-10 L-5,10 L20,0 z');

            marker.setAttribute('transform', getTransformAlong(path, -25));
        });

        editor.on('updateconnection', ({ el,connection }) => {
            const path = el.querySelector('path');
            const marker = el.querySelector('.marker');
            if(connection.data.color){
                path.style.setProperty("stroke", connection.data.color)
            }else{
                path.style.setProperty("stroke", "steelblue")
            }
            if(connection.data.state_color) {
                path.style.setProperty("stroke", connection.data.state_color)
                el.classList.add("select-connection-step")
            }else{
                el.classList.remove("select-connection-step")



            }
            marker.setAttribute('transform', getTransformAlong(path, -25));
        });
    }
}

export default {
    name: 'connection-reroute',
    install
}
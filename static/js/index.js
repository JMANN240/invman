var socket = io.connect("192.168.0.7:8000");

var create_scales = (scales) => {
    $('#scales-body').empty();
    for (const scale of scales) {
        $('#scales-body').append(`
            <tr id='${scale.scale_id.replace(/:/g, '_')}' class='scale'>
                <td id='${scale.scale_id.replace(/:/g, '_')}-id'>${scale.nickname ?? scale.scale_id}</td>
                <td id='${scale.scale_id.replace(/:/g, '_')}-units'>${scale.weight / scale.unit_weight}</td>
                <td>
                    <button id='configure-${scale.scale_id.replace(/:/g, '_')}' class='configuration-button'>Configure</button>
                    <div class='modal' id='modal-${scale.scale_id.replace(/:/g, '_')}'>
                        <div class='modal-options'>
                            <div class='modal-options-row'>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Weight</th>
                                            <th>Unit Weight</th>
                                            <th>Offset</th>
                                            <th>State</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td id='${scale.scale_id.replace(/:/g, '_')}-weight'>${scale.weight}</td>
                                            <td id='${scale.scale_id.replace(/:/g, '_')}-unit-weight'>${scale.state == 'UNIT' ? '?' : scale.unit_weight}</td>
                                            <td id='${scale.scale_id.replace(/:/g, '_')}-offset'>${scale.state == 'TARE' ? '?' : scale.offset}</td>
                                            <td id='${scale.scale_id.replace(/:/g, '_')}-state'>${scale.state}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class='modal-options-row'>
                                <button class='tare-button' id='tare-button-${scale.scale_id.replace(/:/g, '_')}'>Arm for tare</button>
                            </div>
                            <div class='modal-options-row'>
                                <input type='number' placeholder='Units' min='1' id='units-${scale.scale_id.replace(/:/g, '_')}' value='${scale.calibration_units}'>
                                <button id='units-button-${scale.scale_id.replace(/:/g, '_')}' class='units-button'>Arm for units</button>
                            </div>
                            <div class='modal-options-row'>
                                <button class='normal-button' id='normal-button-${scale.scale_id.replace(/:/g, '_')}'>Normal operation</button>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `);
    }
}

var update_scales = (scales) => {
    for (const scale of scales) {
        $(`#${scale.scale_id.replace(/:/g, '_')}-units`).html(`${scale.weight / scale.unit_weight}`);
        $(`#${scale.scale_id.replace(/:/g, '_')}-weight`).html(`${scale.weight}`);
        $(`#${scale.scale_id.replace(/:/g, '_')}-unit-weight`).html(`${scale.state == 'UNIT' ? '?' : scale.unit_weight}`);
        $(`#${scale.scale_id.replace(/:/g, '_')}-offset`).html(`${scale.state == 'TARE' ? '?' : scale.offset}`);
        $(`#${scale.scale_id.replace(/:/g, '_')}-state`).html(`${scale.state}`);
    }
}

$.ajax({
    type: 'GET',
    url: '/api/scales',
    success: create_scales
})

socket.on('new-data', () => {
    $.ajax({
        type: 'GET',
        url: '/api/scales',
        success: update_scales
    });
});

$(document).on('click', '.configuration-button', (e) => {
    var scale_id = $(e.target).attr('id').split('-')[1];
    $(`#modal-${scale_id}`).addClass('visible');
});

$(document).on('click', (e) => {
    if ($(e.target).hasClass('modal')) {
        var scale_id = $(e.target).attr('id').split('-')[1];
        $(`#modal-${scale_id}`).removeClass('visible');
    }
});

$(document).on('click', '.tare-button', (e) => {
    var scale_id = $(e.target).attr('id').split('-')[2];
    $.ajax({
        type: 'POST',
        url: '/api/scales/state',
        data: {state: 'TARE', mac: scale_id},
        success: (res) => {
            $.ajax({
                type: 'GET',
                url: '/api/scales',
                success: update_scales
            })
        }
    });
});

$(document).on('click', '.units-button', (e) => {
    var scale_id = $(e.target).attr('id').split('-')[2];
    console.log($(`#units-${scale_id}`).val());
    $.ajax({
        type: 'POST',
        url: '/api/scales/state',
        data: {state: 'UNIT', mac: scale_id, units: $(`#units-${scale_id}`).val()},
        success: (res) => {
            $.ajax({
                type: 'GET',
                url: '/api/scales',
                success: update_scales
            })
        }
    });
});

$(document).on('click', '.normal-button', (e) => {
    var scale_id = $(e.target).attr('id').split('-')[2];
    $.ajax({
        type: 'POST',
        url: '/api/scales/state',
        data: {state: 'NORMAL', mac: scale_id},
        success: (res) => {
            $.ajax({
                type: 'GET',
                url: '/api/scales',
                success: update_scales
            })
        }
    });
});
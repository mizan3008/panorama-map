window.onload = function() {
    _buildImageListMarkup()
}

const state = {
    payload: [],
    activePayloadId: null,
    activeHotspotId: null,
    uniquePayloadId: 0
}

let viewer = null
let previewer = null

const typeList = ['Unit', 'Level', 'Block']

function _getPayload()
{
    const payload = []

    if(state.payload.length > 0){
        state.payload.forEach((data) => {

            const myPayload = {
                name: data.name,
                type: data.type,
                label: data.label,
                image: data.path,
                pitch: data.pitch,
                yaw: data.yaw,
            }
    
            const hotspots = data.hotspots ?? []
    
            if(hotspots.length > 0){
                hotspots.forEach((hotspot) => {
                    if(hotspot.id.search('from') !== -1){
                        myPayload.fromCoordinates = {
                            pitch: hotspot.pitch ?? 0,
                            yaw: hotspot.yaw ?? 0,
                            to: hotspot.to
                        }
                    }
                    if(hotspot.id.search('to') !== -1){
                        myPayload.toCoordinates = {
                            pitch: hotspot.pitch ?? 0,
                            yaw: hotspot.yaw ?? 0,
                            to: hotspot.to
                        }
                    }
                })
            }

            payload.push(myPayload)
            
        })
    }

    return payload
}

function _copy()
{
    const input = document.createElement('input');
    input.setAttribute('value', JSON.stringify({payload: _getPayload()}));
    document.body.appendChild(input);
    input.select();
    const result = document.execCommand('copy');
    document.body.removeChild(input);
    alert('The payload has been copied to the clipboard.')
    return result;
 }

function _enableHotspotClickEvent(id)
{
    state.activeHotspotId = id
    document.getElementById('panorama').addEventListener("click", _clickEvent)
}

function _clearMouseEvent()
{
    document.getElementById('panorama').removeEventListener("click", _clickEvent)
}

function _getConfig(e)
{
    e.preventDefault()
    const activePayloadId = state.activePayloadId
    _updatePayloadState(activePayloadId, 'pitch', viewer.getPitch())
    _updatePayloadState(activePayloadId, 'yaw', viewer.getYaw())
}

function _clickEvent(e)
{
    e.preventDefault()

    const activePayloadId = state.activePayloadId
    const hotspotId = state.activeHotspotId

    const payload = _getPayloadById(activePayloadId)
    const currentHotspots = payload.hotspots ?? []

    const hotspotPayload = viewer.mouseEventToCoords(e)

    const data = {
        id: hotspotId.toString(),
        text: hotspotId.search('from') !== -1 ? 'From Coordinate' : 'To Coordinate',
        pitch: hotspotPayload[0],
        yaw: hotspotPayload[1],
        to: '',
    }

    viewer.addHotSpot(data)

    currentHotspots.push(data)

    const uniqueHotspots = []

    currentHotspots.forEach((hotspot) => {
        if(uniqueHotspots.indexOf(hotspot) === -1){
            uniqueHotspots.push(hotspot)
        }
    })

    _updatePayloadState(activePayloadId, 'pitch', viewer.getPitch())
    _updatePayloadState(activePayloadId, 'yaw', viewer.getYaw())
    _updatePayloadState(activePayloadId, 'hotspots', uniqueHotspots)

    _buildHotspotSettingsMarkup(activePayloadId)
    _clearMouseEvent()
}

function _removeHotspot(payloadId, hotspotId)
{
    const payload = _getPayloadById(payloadId)
    const hotspots = payload.hotspots ?? []

    if(hotspots.length > 0){
        const newHotspots = hotspots.filter((hotspot) => hotspot.id !== hotspotId)
        _updatePayloadState(payloadId, 'hotspots', newHotspots)
        viewer.removeHotSpot(hotspotId)
        _buildHotspotSettingsMarkup(payloadId)
        _loadPanoramicView(payloadId)
    }
}

function _addImage()
{
    const imagePath = prompt("Insert panoramic image path")
    if(imagePath !== "" || imagePath !== null){

        const paths = imagePath.split(',')
        paths.forEach((path) => {
            if(path !== ""){
                const newPath = path.replace(/(\r\n|\n|\r)/gm, "")
                const filename = newPath.replace(/^.*[\\\/]/, '')
                const label = filename.replace(/\.[^/.]+$/, "")

                const imageData = {
                    id: _uniquePayloadId(),
                    name: '',
                    label: label,
                    type: 'unit',
                    path: newPath,
                    pitch: 0,
                    yaw: 0,
                    hotspots: []
                }

                state.payload.push(imageData)
            }
        })

        _buildImageListMarkup()
    }
}

function _buildImageListMarkup()
{
    let html = ""

    const payload = state.payload ?? []

    if(payload.length > 0){
        payload.forEach((data, index) => {
            let typeOptionHtml = ""
            typeList.forEach((type) => {
                let selected = data.type === type.toLocaleLowerCase() ? 'selected' : ''
                typeOptionHtml += "<option "+selected+" value='"+type.toLocaleLowerCase()+"'>"+type+"</option>"
            })

            html += "<div id='image-"+data.id+"' class='flex items-center justify-between border-2 p-1 mb-2'><div class='border-2'><img src='"+data.path+"' class='w-12'/></div><div class='mx-1'><div class='flex mb-1'><label class='bg-gray-400 p-1'>Name</label><input type='text' name='name' onkeyup='javascript:_setName("+data.id+", this)' class='border-2 w-full required' value='"+data.name+"'/><select onchange='javascript:_setType("+data.id+", this.value)' class='bg-gray-400'>"+typeOptionHtml+"</select></div><div class='flex mb-0'><label class='bg-gray-400 p-1'>Label</label><input type='text' name='label' onkeyup='javascript:_setLabel("+data.id+", this.value)' class='border-2 w-full' value='"+data.label+"'/></div></div><div><a class='bg-red-600 p-1 text-sm rounded inline-flex items-center text-white' href='javascript:_removeImage("+data.id+")'><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-5 h-5'><path stroke-linecap='round' stroke-linejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'/></svg></a></div></div>"
        })
        document.getElementById("nextStep").classList.remove('hidden')
    }else{
        html += "<div class='border-2 mb-1 p-1'>No images</div>"
        document.getElementById("nextStep").classList.add('hidden')
    }
    
    document.getElementById('imageControlPanel').innerHTML = html
}

function _buildHotspotImageListMarkup()
{
    let html = ""
    
    if(state.payload.length > 0){
        state.payload.forEach((data) => {
            html += "<a id='hotspot-image-"+data.id+"' href='javascript:_handleHotspotImageClick("+data.id+")' class='hotspot-images flex items-center justify-between border-2 p-1 mb-2'><div><img src='"+data.path+"' class='w-12 border-2'/></div><div class='mx-1'>"+data.name+" ["+data.label+"]</div></a>"
        })
    }

    document.getElementById('hotspotControlPanel-imageList').innerHTML = html

    _handleHotspotImageClick(state.activePayloadId ?? state.payload[0].id)
}

function _handleHotspotImageClick(id)
{
    _buildHotspotSettingsMarkup(id)
    _loadPanoramicView(id)
}

function _buildHotspotSettingsMarkup(id)
{
    const payload = _getPayloadById(id)

    const hotspotImageElements = document.getElementsByClassName('hotspot-images')

    for (let i = 0; i < hotspotImageElements.length; i++) {
        hotspotImageElements[i].classList.remove("border-green-700")
    }
    document.getElementById("hotspot-image-"+id).classList.add("border-green-700")

    let html = "<div class='my-3 bg-gray-200 p-1'><label>Add Hotspot <strong>["+payload.name+"]</strong></label><div class='border-b-2'></div></div>"

    const fromId = payload.id + "_from"
    const toId = payload.id + "_to"

    const hotspots = payload.hotspots ?? []

    const toHotspot = hotspots.find((hotspot) => hotspot.id === toId)
    if(toHotspot === undefined){
        html += "<div class='mb-1'><a class='bg-gray-400 p-1 text-sm rounded w-full inline-flex items-center' href='javascript:_enableHotspotClickEvent(&#39;"+toId+"&#39;)'><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-5 h-5 mr-2'><path stroke-linecap='round' stroke-linejoin='round' d='M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5' /></svg> Add to Hotspot</a></div>"
    }else{
        const sceneOptionHtml = _getScenesOptionList(toHotspot.to)
        html += "<div class='flex items-center justify-between border-2 p-1 mb-2'><label>To Hotspot</label> <select onchange='javascript:_setScene("+id+", &#39;"+toId+"&#39;, this)' class='bg-gray-200 p-1'>"+sceneOptionHtml+"</select> <a class='bg-red-600 p-1 text-sm rounded inline-flex items-center text-white' href='javascript:_removeHotspot("+id+", &#39;"+toId+"&#39;)'><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-5 h-5'><path stroke-linecap='round' stroke-linejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'/></svg></a></div>"
    }

    const fromHotspot = hotspots.find((hotspot) => hotspot.id === fromId)
    if(fromHotspot === undefined){
        html += "<div class='mb-1'><a class='bg-gray-400 p-1 text-sm rounded w-full inline-flex items-center' href='javascript:_enableHotspotClickEvent(&#39;"+fromId+"&#39;)'><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-5 h-5 mr-2'><path stroke-linecap='round' stroke-linejoin='round' d='M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5' /></svg> Add from Hotspot</a></div>"        
    }else{
        const sceneOptionHtml = _getScenesOptionList(fromHotspot.to)
        html += "<div class='flex items-center justify-between border-2 p-1 mb-2'><label>From Hotspot</label> <select onchange='javascript:_setScene("+id+", &#39;"+fromId+"&#39;, this)' class='bg-gray-200 p-1'>"+sceneOptionHtml+"</select> <a class='bg-red-600 p-1 text-sm rounded inline-flex items-center text-white' href='javascript:_removeHotspot("+id+", &#39;"+fromId+"&#39;)'><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-5 h-5'><path stroke-linecap='round' stroke-linejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'/></svg></a></div>"
    }

    document.getElementById('hotspotControlPanel-hotspotSettings').innerHTML = html
}

function _removeImage(payloadId)
{
    const command = confirm("Are you sure, you want to remove this image?")
    if(command){
        const index = state.payload.findIndex((data) => data.id === payloadId)
        if(index >= 0){
            state.payload.splice(index, 1)
            document.getElementById("image-"+payloadId).remove()

            const payloadLength = state.payload.length

            if(payloadLength > 0 && payloadId === state.activePayloadId){
                state.activePayloadId = state.payload[0].id
            }

            if(payloadLength === 0){
                state.activePayloadId = null
                _buildImageListMarkup()
            }
        }
    }
}

function _setName(id, element)
{
    if(element.value === ""){
        element.classList.add("border-red-500")
    }else{
        _updatePayloadState(id, 'name', element.value)
        element.classList.remove("border-red-500")
    }
}

function _setLabel(id, value)
{
    _updatePayloadState(id, 'label', value)
}

function _setType(id, value)
{
    _updatePayloadState(id, 'type', value)
}

function _setScene(payloadId, hotspotId, element)
{
    const payload = _getPayloadById(payloadId)
    const hotspots = payload.hotspots ?? []
    if(hotspots.length > 0){
        hotspots.forEach((hotspot) => {
            if(hotspot.id === hotspotId){
                hotspot.to = element.value
            }
        })
    }
}

function _loadPanoramicView(id)
{
    state.activePayloadId = id
    const activePayload = _getPayloadById(id)

    if(viewer){
        viewer.destroy()
    }

    viewer = pannellum.viewer('panorama', {
        "type": "equirectangular",
        "panorama": activePayload.path,
        "autoLoad": true,
        "pitch": activePayload.pitch ?? 0,
        "yaw": activePayload.yaw ?? 0,
        "hotSpots": activePayload.hotspots ?? []
    })

    document.getElementById('panorama').addEventListener("click", _getConfig)
}

function _preview()
{
    const payload = _getPayload()

    const previewPayload = {   
        "default": {
            "firstScene": payload[0].name,
            "sceneFadeDuration": 1000,
            "autoLoad": true
        },
    
        "scenes": {}
    }

    payload.forEach((data) => {

        const hotSpots = []

        if(data.fromCoordinates){
            hotSpots.push({
                "pitch": data.fromCoordinates.pitch,
                "yaw": data.fromCoordinates.yaw,
                "type": "scene",
                "sceneId": data.fromCoordinates.to
            })
        }

        if(data.toCoordinates){
            hotSpots.push({
                "pitch": data.toCoordinates.pitch,
                "yaw": data.toCoordinates.yaw,
                "type": "scene",
                "sceneId": data.toCoordinates.to
            })
        }

        previewPayload['scenes'][data.name] = {
            "pitch": data.pitch,
            "yaw": data.yaw,
            "type": "equirectangular",
            "panorama": data.image,
            "hotSpots": hotSpots
        }
    })

    previewer = pannellum.viewer('panoramicPreview', previewPayload);
    document.getElementById('previewModal').classList.toggle("hidden")
}

function toggleModal(){
    if(previewer){
        previewer.destroy()
    }

    document.getElementById('previewModal').classList.toggle("hidden")
}

function _next(step)
{
    if(_validate() === false){
        return false
    }

    _buildHotspotImageListMarkup()

    _toggleStep(step)
}

function _back(step)
{
    _toggleStep(step)
}

function _toggleStep(step)
{
    const elements = document.getElementsByClassName('steps')
    for (let i = 0; i < elements.length; i++) {
        elements[i].classList.add("hidden")
    }
    document.getElementById(step).classList.remove("hidden")
}

function _updatePayloadState(id, key, value)
{
    const index = state.payload.findIndex((data) => data.id === id)
    if(index >= 0){
        state.payload[index][key] = value
    }
}

function _validate()
{
    let notValidateCount = 0
    const elements = document.getElementsByClassName('required')
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i]
        if(element.value === ""){
            elements[i].classList.add("border-red-500")
            notValidateCount += 1
        }else{
            elements[i].classList.remove("border-red-500")
        }
    }

    return notValidateCount === 0
}

function _getPayloadById(id)
{
    const payload = state.payload.find((p) => p.id === id)
    return payload ?? {}
}

function _uniquePayloadId()
{
    return state.uniquePayloadId += 1
}

function _getScenesOptionList(value = '')
{
    let html = "<option>-- Scenes --</option>"

    state.payload.forEach((data) => {
        const selected = data.name === value ? 'selected' : ''
        html += "<option "+selected+" value='"+data.name+"'>"+data.name+"</option>"
    })

    return html
}
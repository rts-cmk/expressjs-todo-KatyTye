// IMPORTS
import express from "express"
import multer from "multer";
import cors from "cors"
import fs from "fs"

// CONSTANTS AND LETS
const upload = multer();
const server = express()
const PORT = process.env.PORT || 3000
let currentIDs = 1

// SETUP
server.use(cors())
server.use(express.json())

// FUNCTIONS
function returnJSON(name = "todo") {
	return JSON.parse(fs.readFileSync(`./src/jsons/${name}.json`, "utf8"))
}

function updateJSON(newJSON, name = "todo") {
	fs.writeFileSync(`./src/jsons/${name}.json`, JSON.stringify(newJSON, null, 2))
}

function sendError(response, code = 404, message = "Requested id does not exist.") {
	return response.status(code).json({ success: false, message: message })
}

// PATHS
server.get("/todo", (request, response) => {
	response.status(200).json(returnJSON())
})

// GET SPECIFIC ITEM
server.get("/todo/:id", async (request, response) => {
	const ID_PARAM = request.params.id
	let data = await returnJSON()
	let foundData = null

	if (!data.ids[ID_PARAM] === false) {
		return sendError(response)
	}

	data.results.forEach((category) => {
		if (category.list.find((element) => element.id == ID_PARAM)) {
			foundData = category.list.find((element) => element.id == ID_PARAM)
		}
	})

	if (foundData === null) {
		return sendError(response)
	} else {
		response.status(200).json(foundData)
	}
})

// CREATE NEW ITEM OR CATEGORY
server.post("/todo", upload.none(), async (request, response) => {
	let data = await returnJSON()
	let body = request.body
	let newItem

	if (!body) {
		return sendError(response, 406, "Your request does not fulfill the requirements. (body needed)")
	}

	if (!body.type) {
		return sendError(response, 406, "Your request does not fulfill the requirements. (type needed)")
	}

	if (body.type != "category" && body.type != "item") {
		return sendError(response, 406, "Your request type cannot be anthing other then category or item.")
	}

	if (body.type === "item") {
		if (!body.title || !body.tags || !body.authors) {
			return sendError(response, 406, "Your request does not fulfill the requirements. (title, tags and authors needed)")
		}

		currentIDs += 1
		data.ids.push(currentIDs)

		newItem = {
			"id": currentIDs,
			"progress": 0,
			"title": body.title,
			"tags": JSON.parse(body.tags),
			"authors": JSON.parse(body.authors)
		}

		data.results.find(
			(category) => category.category == data.default
		).list.push(newItem)

		updateJSON(data)

		response.status(201).json(
			{
				success: true,
				message: "created new todo item"
			}
		)
	} else {
		if (!body.title || !body.color) {
			return sendError(response, 406, "Your request does not fulfill the requirements. (title and color needed)")
		}

		const NEW_CATEGORY = {
			"category": body.title,
			"color": body.color,
			"list": []
		}

		data.results.push(NEW_CATEGORY)

		updateJSON(data)

		response.status(201).json(
			{
				success: true,
				message: "created new category"
			}
		)
	}
})

// UPDATE ITEM
server.put("/todo", upload.none(), async (request, response) => {
	let data = await returnJSON()
	let body = request.body
	let changed = false

	if (!body) {
		return sendError(response, 406, "Your request does not fulfill the requirements. (body needed)")
	}

	if (!body.id || !body.progress || !body.title || !body.tags || !body.authors) {
		return sendError(response, 406, "Your request does not fulfill the requirements. (id and entire item needed)")
	}

	if (!data.ids[body.id] === false) {
		return sendError(response)
	}

	data.results.forEach((category) => {
		if (category.list.find((element) => element.id == body.id)) {
			element.progress = body.process
			element.title = body.title
			element.tags = body.tags
			element.authors = body.authors
			changed = true
		}
	})

	if (changed === false) {
		return sendError(response, 304, "Your request changed nothing in the data.")
	} else {
		updateJSON(data)

		response.status(202).json(
			{
				success: true,
				message: `updated entire item with id ${body.id}.`
			}
		)
	}
})

// UPDATE SPECIFIC ITEM OR CATEGORY
server.patch("/todo", upload.none(), async (request, response) => {
	let data = await returnJSON()
	let body = request.body

	if (!body) {
		return sendError(response, 406, "Your request does not fulfill the requirements. (body needed)")
	}

	if (!body.type) {
		return sendError(response, 406, "Your request does not fulfill the requirements. (type needed)")
	}

	if (body.type != "category" && body.type != "item") {
		return sendError(response, 406, "Your request type cannot be anthing other then category or item.")
	}

	if (body.type === "item") {
		let oldValue = "nothing"

		if (!body.id || !body.value || !body.item) {
			return sendError(response, 406, "Your request does not fulfill the requirements. (id, item and value needed)")
		}

		if (!data.ids[body.id] === false) {
			return sendError(response)
		}

		data.results.forEach((category) => {
			if (category.list.find((element) => element.id == body.id)) {
				let elem = category.list.find((element) => element.id == body.id)

				if (body.item != "tags" && body.item != "authors") {
					oldValue = elem[body.item]
					elem[body.item] = Number(body.value) || body.value
				} else {
					if (body.item == "tags") {
						if (!elem.tags.find((lis) => lis == body.value)) {
							elem.tags.push(body.value)
						} else {
							elem.tags = elem.tags.filter(fil => fil !== body.value)
						}
					} else {
						let obj = JSON.parse(body.value)

						if (!elem.authors.find((lis) => lis.name == obj.name)) {
							elem.authors.push(obj)
						} else {
							elem.authors = elem.authors.filter(fil => fil.name != obj.name)
						}
					}
				}
			}
		})

		updateJSON(data)

		response.status(202).json(
			{
				success: true,
				message: `updated item with id ${body.id}. (${body.item})`
			}
		)
	} else {
		let oldValue = "nothing"

		if (!body.name || !body.value || !body.item) {
			return sendError(response, 406, "Your request does not fulfill the requirements. (name, item and value needed)")
		}

		if (body.name === "list") {
			return sendError(response, 406, "You cannot set the list to a text.")
		}

		data.results.forEach((category) => {
			if (category.category == body.name) {
				oldValue = category[body.item]
				category[body.item] = body.value
			}
		})

		updateJSON(data)

		response.status(202).json(
			{
				success: true,
				message: `updated category named ${body.name}. (${body.item}: ${oldValue} => ${body.item}: ${body.value})`
			}
		)
	}
})

server.delete("/todo", async (request, response) => {
	let data = await returnJSON()
	let body = request.body

	if (!body) {
		return sendError(response, 406, "Your request does not fulfill the requirements. (body needed)")
	}

	if (!body.type) {
		return sendError(response, 406, "Your request does not fulfill the requirements. (type and name/id needed)")
	}

	if (body.type != "category" && body.type != "item") {
		return sendError(response, 406, "Your request type cannot be anthing other then category or item.")
	}

	if (!body.id) {
		return sendError(response, 406, "Your request does not fulfill the requirements. (type and name/id needed)")
	}

	if (body.type === "item") {
		if (!data.ids[body.id] === false) {
			return sendError(response)
		}

		data.ids.splice(data.ids.indexOf(body.id), 1)

		data.results.forEach((category) => {
			if (category.list.find((element) => element.id == body.id)) {
				category.list = category.list.filter((fil) => fil.id != body.id)
			}
		})

		updateJSON(data)

		response.status(200).json({
			success: true,
			message: "the item is now removed"
		})
	} else {
		let category = data.results.find((category) => category.category == body.id)

		if (!category) {
			return sendError(response, 404, "Your requested category does not exist.")
		}

		if (category.list.length != 0 || data.default == category.category) {
			return sendError(response, 406, "Your requested category has items or is the default, please change it.")
		}

		data.results = data.results.filter((category) => category.category != body.id)

		updateJSON(data)

		response.status(200).json({
			success: true,
			message: "the category is now removed"
		})
	}
})

// LISTENER
server.listen(PORT, () => console.log(`Server is now running on port ${PORT}.`))
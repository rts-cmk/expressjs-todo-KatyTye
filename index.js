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
server.post("/todo", async (request, response) => {
	let data = await returnJSON()
	let body = request.body
	let newItem

	if (!body) {
		return sendError(response, 406, "Your request does not fulfill the requirements. (body needed)")
	}

	if (!body.type) {
		return sendError(response, 406, "Your request does not fulfill the requirements. (type needed)")
	}

	if (body.type != "category" || body.type != "item") {
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
			"tags": body.tags,
			"authors": body.authors
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
			"category": "awaiting",
			"color": "red",
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
server.put("/todo", async (request, response) => {
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

	console.log(body)

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
				oldValue = category.list.find((element) => element.id == body.id)[body.item]
				category.list.find((element) => element.id == body.id)[body.item] = body.value
			}
		})

		updateJSON(data)

		response.status(202).json(
			{
				success: true,
				message: `updated item with id ${body.id}. (${body.item}:${oldValue} => ${body.item}:${body.value})`
			}
		)
	} else {
		let oldValue = "nothing"

		if (!body.name || !body.value || !body.item) {
			return sendError(response, 406, "Your request does not fulfill the requirements. (name, item and value needed)")
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
				message: `updated category named ${body.name}. (${body.item}:${oldValue} => ${body.item}:${body.value})`
			}
		)
	}
})

// LISTENER
server.listen(PORT, () => console.log(`Server is now running on port ${PORT}.`))
async function beginFetch(meth, bod) {
	console.log(bod)
	const res = await fetch("http://localhost:3000/todo", {
		method: meth,
		body: bod,
		headers: {
			"Content-Type": "application/json"
		}
	});

	const data = await res.json()
	console.log(data.message)
	// document.querySelector("iframe").src = document.querySelector("iframe").src
}

document.addEventListener("DOMContentLoaded", () => {
	const patch = document.querySelector("#patch");
	const dele = document.querySelector("#delete");
	const post = document.querySelector("#post");

	patch.addEventListener("submit", (event) => {
		event.preventDefault()

		const formData = new FormData(patch);

		beginFetch("PATCH", formData)
	});

	post.addEventListener("submit", (event) => {
		event.preventDefault()

		const formData = new FormData(post)
		const Entries = Object.fromEntries(formData.entries())

		fetch("http://localhost:3000/todo", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(Entries)
		})
			.then(res => res.json())
			.then(data => console.log(data))
	});

	dele.addEventListener("submit", (event) => {
		event.preventDefault()

		const formData = new FormData(dele)
		const Entries = Object.fromEntries(formData.entries())

		fetch("http://localhost:3000/todo", {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(Entries)
		})
			.then(res => res.json())
			.then(data => console.log(data))
	});
});
import React from 'react';

const isProd = import.meta.env.PROD;
const imgBaseUrl = isProd ? 'https://sc-star.s3.amazonaws.com/images' : './src/images';

export function Card(props) {
	const {
		key,
		data,
	} = props;

	const imgUrl = `${imgBaseUrl}/${data.sourceEntry.data.guid}/${data.attrs.guid}.png`;

	return (
		<>
			<img src={imgUrl} className="quote-img" title={`Figure from ${data.sourceEntry.data.name}`}/>

			<div>
				<div className="codes">
					{data.codeEntries.map(code => (
						<span className="code-pill">{code.data.name}</span>
					))}
				</div>
			</div>
		</>
	);
}
/*<
---
interface Props {
	data: any;
	key: string;
}

const { key, data } = Astro.props;

const imgUrl = `./src/images/${data.sourceEntry.data.guid}/${data.attrs.guid}.png`;
---



<div class="link-card">
	<img src={imgUrl} class="quote-img" title={`Figure from ${data.sourceEntry.data.name}`}/>

	<div>
		<div class="codes">
			{data.codeEntries.map(code => (
				<span class="code-pill">{code.data.name}</span>
			))}
		</div>
</div>
<style>
	.link-card {
		list-style-type: none;
		margin: 0;
		padding: 0;
		display: inline-block;
		width: 100%;
		height: 100%;
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-sizing: border-box;
	}
	.img-container {
		width: 100%;
	}
	.quote-img {
		display: block;
		max-width: 100%;
		max-height: 500px;
		object-fit: contain;
	}
	.codes {
		width: auto;
	}
	.code-pill {
		display: inline;
		background-color: lightblue;
		border-radius: 15px;
		padding: 0px 8px;
		margin: 0px 4px;
	}
</style>
*/

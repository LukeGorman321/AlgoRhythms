const input = document.getElementById('csvFile');
      input.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = event => {
          const lines = event.target.result.trim().split('\n');
		  
		  let songs = [];
		  let in_quote = false;
		  let line = [];
          for (let i = 1; i < lines.length; i++) {
			  line = [""];
			  for (let j = 0; j < lines[i].length; j++) {
				 if (lines[i][j] == '"') {
					 in_quote = !in_quote;
				 } else if (lines[i][j] == ',' && !in_quote) {
					 line.push("");
				 } else {
					 line[line.length-1] += lines[i][j];
				 }
			  }
			  
			  songs.push(new Song(line));
		  }	  
          console.log(songs[0]);
		  
		  let root = new KD_Node(null, songs[0], songs[0].acousticness, songs[0].danceability, songs[0].energy);
		  let rooto = new Oct_Node(null, songs[0], songs[0].acousticness, songs[0].danceability, songs[0].energy);
		  let tree = new KD_Tree(root);
		  let octopus = new Octree(rooto);
		  
		  for (let i = 1; i < songs.length; i++) {
			  tree.insert(new KD_Node(null, songs[i], songs[i].acousticness, songs[i].danceability, songs[i].energy)); 
			  octopus.insert(new Oct_Node(null, songs[i], songs[i].acousticness, songs[i].danceability, songs[i].energy));
		  }
		  
		  let k = 20;
		  let kd_nearest = tree.k_nearest_n([0.5, 0.5, 0.5], k);
		  let qNode = new Oct_Node(null, null, 0.5, 0.5, 0.5);
		  let oct_nearest = octopus.k_nearest_n(qNode, k);
		  		  
		  for (let i = 0; i < k; i++) {
			  console.log(i + " " + kd_nearest[i].song.name + " " + distance([0.5, 0.5, 0.5], kd_nearest[i]));
			  console.log(i + " " + oct_nearest[i].song.name + " " + distance([0.5, 0.5, 0.5], oct_nearest[i]));
		  }
        };
        reader.readAsText(file);
      });

class Song {
	constructor(info) {
		this.id = info[0];
		this.name = info[1];
		this.artists = info[2];
		this.duration = info[3];
		this.release_date = info[4];
		this.year = info[5];
		this.acousticness = info[6];
		this.danceability = info[7];
		this.energy = info[8];
		this.instrumentalness = info[9];
		this.liveness = info[10];
		this.loudness = info[11];
		this.speechiness = info[12];
		this.tempo = info[13];
		this.valence = info[14];
		this.mode = info[15];
		this.key = info[16];
		this.popularity = info[17];
		this.explicit = info[18];
	}
}

class KD_Node {
	constructor(parent_node, song, x, y, z) {
		this.song = song;
		this.point = [x, y, z];
		this.dimension = 0;
		this.left = null;
		this.right = null;
		this.parent_node = parent_node;
		this.depth = 0;
	}
	
	toString() {
		let output = this.depth + ": Song Name: " + this.song.name + " x: " + this.point[0] + " y: " + this.point[1] + " z: " + this.point[2] + " dimension: " + this.dimension + "\n";
		if (this.left != null) {
			output = output + this.left.toString();
		}
		if (this.right != null) {
			output = output + this.right.toString();
		}
		return output + "\n";
	}
	
	k_nearest_n(point, best_songs, best_values, k) {
		let left = false;
		// iterate down
		if (point[this.dimension] > this.point[this.dimension]) {
			if (this.right !== null) {
				this.right.k_nearest_n(point, best_songs, best_values, k);
			}
		} else if (this.left !== null) {
			this.left.k_nearest_n(point, best_songs, best_values, k);
			left = true;
		} else {
			left = true;
		}
		
		// insert into best_songs
		let curr_dist = distance(point, this);
		let iter_node = this;
		let temp_dist = 0;
		let temp_node = null;
		
		for (let i = 0; i < k; i++) {
			if (best_songs[i] === null) {
				best_songs[i] = iter_node;
				best_values[i] = curr_dist;
				break;
			}
			if (curr_dist < best_values[i]) {
				temp_dist = best_values[i];
				temp_node = best_songs[i];
				
				best_songs[i] = iter_node;
				best_values[i] = curr_dist;
				
				iter_node = temp_node;
				curr_dist = temp_dist;
			}
		}
		
		// Check other direction		
		if (best_songs[k-1] == null || (point[this.dimension] - this.point[this.dimension])**2 < best_values[k-1]) {
			if (left && this.right !== null) {
				this.right.k_nearest_n(point, best_songs, best_values, k);
			} else if (!left && this.left !== null) {
				this.left.k_nearest_n(point, best_songs, best_values, k);
			}
		}
	}
}

class Oct_Node {
	constructor(parent_node, song, x, y, z) {
		this.song = song;
		this.point = [x, y, z];
		this.children = [null, null, null, null, null, null, null, null];
		this.parent_node = parent_node;
		this.depth = 0;
	}
	
	getIndex(node) {
		let index = 0;
		if (node.point[0] > this.point[0]) { index++; }
		if (node.point[1] > this.point[1]) { index+=2; }
		if (node.point[2] > this.point[2]) { index+=4; }
		return index;
	}
	
	toString() {
		let output = this.depth + ": Song Name: " + this.song.name + " x: " + this.point[0] + " y: " + this.point[1] + " z: " + this.point[2] + "\n";
		for (let i = 0; i < 8; i++) {
			if (this.children[i] != null) {
				output = output + "index: " + i + " " + this.children[i].toString();
			}
		}
		return output + "\n";
	}
	
	k_nearest_n(node, best_songs, best_values, k) {
		let best_index = this.getIndex(node);
		
		// iterate down
		if (this.children[best_index] != null) {
			this.children[best_index].k_nearest_n(node, best_songs, best_values, k);
		}
			
		// insert into best_songs
		let curr_dist = distance(node.point, this);
		let iter_node = this;
		let temp_dist = 0;
		let temp_node = null;
		
		for (let i = 0; i < k; i++) {
			if (best_songs[i] === null) {
				best_songs[i] = iter_node;
				best_values[i] = curr_dist;
				break;
			}
			if (curr_dist < best_values[i]) {
				temp_dist = best_values[i];
				temp_node = best_songs[i];
				
				best_songs[i] = iter_node;
				best_values[i] = curr_dist;
				
				iter_node = temp_node;
				curr_dist = temp_dist;
			}
		}
		
		// Check other directions
		let best_possible_distance = 0;
		for (let mask = 1; mask < 8; mask++) {
			if (this.children[best_index ^ mask] != null) {
				best_possible_distance = 0;	
				if ((mask & 1) == 1) {
					best_possible_distance += (node.point[0] - this.point[0])**2;
				}
				if ((mask & 2) == 2) {
					best_possible_distance += (node.point[1] - this.point[1])**2;
				}
				if ((mask & 4) == 4) {
					best_possible_distance += (node.point[2] - this.point[2])**2;
				}
				if (best_songs[k-1] == null || best_possible_distance < best_values[k-1]) {
					this.children[best_index ^ mask].k_nearest_n(node, best_songs, best_values, k);
				}
			}
		}
	}
}

function distance(point, song) {
	let x_dist = (point[0] - song.point[0])**2;
	let y_dist = (point[1] - song.point[1])**2;
	let z_dist = (point[2] - song.point[2])**2;
	return x_dist + y_dist + z_dist;
}

class KD_Tree {
	constructor(root) {
		this.root = root;
	}
	
	insert(song) { // insert a new song node into the tree
		let curr_node = this.root; // the node we are checking to see if it should be the parent
		
		while (true) { // traverse down the tree to find where to put the node
			if (song.point[curr_node.dimension] > curr_node.point[curr_node.dimension]) {
				if (curr_node.right === null) {
					curr_node.right = song;
					song.parent_node = curr_node;
					song.depth = song.parent_node.depth + 1;
					song.dimension = (curr_node.dimension + 1) % 3;
					return;
				}
				curr_node = curr_node.right;
			} else {
				if (curr_node.left === null) {
					curr_node.left = song;
					song.parent_node = curr_node;
					song.depth = song.parent_node.depth + 1;
					song.dimension = (curr_node.dimension + 1) % 3;
					return;
				}
				curr_node = curr_node.left;
			}
		}
	}
	
	toString() {
		return this.root.toString();
	}
	
	k_nearest_n(point, k) { // find the k nearest neighbors of the point (x, y, z)
		let best_songs = new Array(k).fill(null); // references to the k best songs
		let best_values = []; // distance to k best songs		
		
		this.root.k_nearest_n(point, best_songs, best_values, k);
		
		return best_songs;
		// traverse the tree to the section where the point would go
		/*let explored = new Set();

		while (true) {
			if (point[curr_node.dimension] > curr_node.point[curr_node.dimension]) {
				if (curr_node.right === null) {
					break;
				}
				curr_node = curr_node.right;
			} else {
				if (curr_node.left === null) {
					break;
				}
				curr_node = curr_node.left;
			}
		}	

		let curr_dist = 0;
		let iter_node = null;
		let temp_node = null;
		let temp_dist = 0;
		let check_other_side = false;
		
		let dim_point = 0;
		let dim_curr = 0;
		let skip = false;
		while (true) {
			explored.add(curr_node);
			//console.log(curr_node.song.name);
			// Put it at the proper point in best
			check_other_side = false;
			curr_dist = distance(point, curr_node);
			iter_node = curr_node;
			temp_dist = 0;
			temp_node = null;
			skip = false;
			
			for (let i = 0; i < k; i++) {
				if (best_songs[i] === null) {
					best_songs[i] = iter_node;
					best_values[i] = curr_dist;
					break;
				}
				if (curr_dist < best_values[i]) {
					temp_dist = best_values[i];
					temp_node = best_songs[i];
					
					best_songs[i] = iter_node;
					best_values[i] = curr_dist;
					
					iter_node = temp_node;
					curr_dist = temp_dist;
				} else if (curr_node == best_songs[i]) {
					skip = true;
				}
			}
			
			if (!skip) {
				// Check if there could be better points on the other side
				if (best_songs[k-1] === null || (point[curr_node.dimension] - curr_node.point[curr_node.dimension])**2 < best_values[k-1]) {
					check_other_side = true;
				}
				
				// If there are, go down that side
				if (check_other_side) {
					if (point[curr_node.dimension] < curr_node.point[curr_node.dimension] && curr_node.right != null) {
						curr_node = curr_node.right;
					} else if (point[curr_node.dimension] > curr_node.point[curr_node.dimension] && curr_node.left != null) {
						curr_node = curr_node.left;
					} else {
						skip = true;
					}
					while (!skip) {
						if (point[curr_node.dimension] > curr_node.point[curr_node.dimension]) {
							if (curr_node.right === null) {
								break;
							}
							curr_node = curr_node.right;
						} else {
							if (curr_node.left === null) {
								break;
							}
							curr_node = curr_node.left;
						}
					}
					if (!skip) {
						continue;
					}
				}
			}
			
			// else, go back up
			if (curr_node.parent_node === null) { // break loop if root
				break;
			}
			
			while (curr_node.parent_node !== null) {
				if (explored.has(curr_node.parent_node)) {
					curr_node = curr_node.parent_node;
				} else {
					break;
				}
			}
			curr_node = curr_node.parent_node;
		}
		*/
	}
}





class Octree {
	constructor(root) {
		this.root = root;
	}
	
	insert(song) { // insert a new song node into the tree
		let curr_node = this.root; // the node we are checking to see if it should be the parent
		let index = -1;
		while (true) { // traverse down the tree to find where to put the node
			index = curr_node.getIndex(song);
			if (curr_node.children[index] === null) {
				curr_node.children[index] = song;
				song.parent_node = curr_node;
				song.depth = song.parent_node.depth + 1;
				return;
			}
			curr_node = curr_node.children[index];
		}
	}
	
	toString() {
		return this.root.toString();
	}
	
	k_nearest_n(node, k) { // find the k nearest neighbors of the node
		let best_songs = new Array(k).fill(null); // references to the k best songs
		let best_values = []; // distance to k best songs		
		
		this.root.k_nearest_n(node, best_songs, best_values, k);
		
		return best_songs;
	}
}
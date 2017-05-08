#!/usr/bin/perl -w
use strict;

my @conditions = split /,/, $ARGV[0];
my $lim = @conditions;
#my $dir = `pwd`;
my $dir = '.';
chomp $dir;
my @repcounts = split /,/, $ARGV[1];
#my $delimiter=$ARGV[2];

my $output_dir = $dir ."/DESeq2";
#open (OUT_PBS,">$dir\/submit_DESEQ2_R_script.sh") || die "Cannot open output file $dir\/submit_DESEQ2_R_script.sh\n\n";
open (OUT_R,">$dir\/DESEQ2.R") || die "Cannot open output file $dir\/DESEQ2.R\n\n";

print OUT_R "library(DESeq2)
library(\"pheatmap\", lib=\"/scratch/ad163/Manuka2/Project_Aissatou/Count_htseq/ALL_MANUKA/pheatmap/\")

options(bitmapType=\"cairo\")

directory<-\"$dir/\"

sampleFiles<-grep(\"\.txt\",list\.files(directory),value=TRUE)
sampleFiles

sampleN <- sub(\"(*)_*\.txt\","."\"\\"."\\1\",sampleFiles)

";

my $sample_conditions;
my $setup = "sampleCondition <- factor(c(";
my $check;

my $i = 0;
foreach my $cond(@conditions){

#my $rep_count = `ls -1 $cond$delimiter* | grep -c ""`;
my $rep_count = $repcounts[$i++];
chomp $rep_count;

$setup .= "rep(\"$cond\", $rep_count)";

$check = $conditions[$#conditions];

unless($cond eq $check) {
        $setup .= ",";
    }

}

$setup .= "))
sampleCondition

sampleTable <- data.frame(sampleName = sampleN, fileName = sampleFiles, condition = sampleCondition)
sampleTable


dds <- DESeqDataSetFromHTSeqCount(sampleTable = sampleTable,directory = directory,design= ~ condition,ignoreRank=FALSE)
dds

dds <- DESeq(dds)

rld <- rlog(dds)
vsd <- varianceStabilizingTransformation(dds)
rlogMat <- assay(rld)
vstMat <- assay(vsd)

write.table(rlogMat, \"$output_dir/deseq2_all_samples_rlog.csv\", sep=\"\\t\")
write.table(vstMat, \"$output_dir/deseq2_all_samples_vst.csv\", sep=\"\\t\")


sampleDists <- dist(t(assay(rld)))
library(\"RColorBrewer\")
sampleDistMatrix <- as.matrix(sampleDists)
rownames(sampleDistMatrix) <- paste(colnames(rld))
colnames(sampleDistMatrix) <- NULL
colors <- colorRampPalette( rev(brewer.pal(9, \"Blues\")) )(255)
pdf(\"$output_dir/deseq2_all_samples_rlog_heatmap.pdf\")
rlogHeat <- pheatmap(sampleDistMatrix,clustering_distance_rows=sampleDists,clustering_distance_cols=sampleDists,col=colors)
rlogHeat
dev.off()


sampleDists <- dist(t(assay(vsd)))
library(\"RColorBrewer\")
sampleDistMatrix <- as.matrix(sampleDists)
rownames(sampleDistMatrix) <- paste(colnames(rld))
colnames(sampleDistMatrix) <- NULL
colors <- colorRampPalette( rev(brewer.pal(9, \"Blues\")) )(255)
pdf(\"$output_dir/deseq2_all_samples_vst_heatmap.pdf\")
vstHeat <- pheatmap(sampleDistMatrix,clustering_distance_rows=sampleDists,clustering_distance_cols=sampleDists,col=colors)
vstHeat
dev.off()

";

print OUT_R "$setup\n\n";


for (my $i = 0;$i<$lim;$i++){

	for (my $i2 = $i+1;$i2<$lim;$i2++){
    
	print OUT_R "C$conditions[$i]VSC$conditions[$i2] <- results\(dds,contrast=c\(\"condition\",\"$conditions[$i]\",\"$conditions[$i2]\"\)\)\n";
	print OUT_R "write.table\(C$conditions[$i]VSC$conditions[$i2], \"$output_dir/$conditions[$i]VS$conditions[$i2].csv\", sep=\"\\t\")
png\(\"$output_dir/$conditions[$i]VS$conditions[$i2]\_MAplot.png\"\)
plotMA\(C$conditions[$i]VSC$conditions[$i2], main=\"$conditions[$i]\_VSC_$conditions[$i2]\", ylim=c\(-8,8\)\)
dev.off\(\)\n\n";
	}
}

#print OUT_PBS "#!/bin/bash
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=1
#SBATCH --time=15:00:00
#SBATCH --mem 50000

#module load gencore/1
#module load gencore_rnaseq/1.0


#cd $dir

#R CMD BATCH --no-save DESEQ2.R
#";

close OUT_R;
#close OUT_PBS;


